'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { useFormulario } from '@/components/forms/useFormulario';
import { entrar, getSesion, guardarSesion } from '@/lib/auth';
import { cambiarACuenta, listarCuentas, recordarCuenta } from '@/lib/cuentas';
import type { Sesion } from '@/types';

// "Web · Agregar cuenta": entra a otra cuenta sin perder la actual (se guardan en este navegador)
export default function AgregarCuentaPage() {
  const router = useRouter();
  const [actual, setActual] = useState<Sesion | null>(null);
  const [otras, setOtras] = useState<Sesion[]>([]);
  useEffect(() => {
    const s = getSesion();
    setActual(s);
    setOtras(listarCuentas().filter((c) => c.usuario.id !== s?.usuario.id));
  }, []);

  const { onSubmit, error, cargando } = useFormulario(async (datos) => {
    const anterior = getSesion();
    if (anterior && datos.email.trim().toLowerCase() === anterior.usuario.email.toLowerCase()) throw new Error('Esa ya es tu cuenta actual.');
    const nueva = await entrar('/auth/login', datos);
    recordarCuenta(anterior);
    guardarSesion(nueva);
    window.location.href = nueva.usuario.rol === 'negocio' ? '/portal' : '/home';
  });

  function cambiar(id: string) {
    if (cambiarACuenta(id)) window.location.href = '/home';
  }

  return (
    <>
      <EncabezadoCuenta titulo="Agregar cuenta" sub="Accede a otra cuenta sin mezclar tu información." />
      <section className="acc-tarjeta">
        <h2>Cuenta actual · {actual?.usuario.nombre}</h2>
        <p className="acc-texto">{actual?.usuario.email}</p>
        <form className="acc-form" onSubmit={onSubmit}>
          <label className="acc-campo">Correo electrónico<input name="email" type="email" required autoComplete="off" placeholder="Ingresa el correo de la otra cuenta" /></label>
          <label className="acc-campo">Contraseña<input name="password" type="password" required autoComplete="off" placeholder="Ingresa tu contraseña" /></label>
          <Link href="/recuperar" className="acc-enlace acc-enlace--fuerte">¿Olvidaste tu contraseña?</Link>
          {error && <p className="acc-error" role="alert">{error}</p>}
          <button type="submit" className="acc-btn" disabled={cargando}>{cargando ? 'Entrando…' : 'Agregar cuenta'}</button>
        </form>
        <p className="acc-texto">Las reservas, favoritos y datos de cada cuenta se mantienen separados. Las cuentas agregadas se guardan solo en este navegador y se olvidan al cerrar sesión.</p>
        {otras.length > 0 && (
          <div className="cta-cuentas">
            <h3 className="cta-h3">Otras cuentas en este navegador</h3>
            {otras.map((s) => (
              <button key={s.usuario.id} type="button" className="acc-btn-borde" onClick={() => cambiar(s.usuario.id)}>Cambiar a {s.usuario.nombre} · {s.usuario.email}</button>
            ))}
          </div>
        )}
        <button type="button" className="acc-btn-borde" onClick={() => { recordarCuenta(getSesion()); router.push('/registro'); }}>Crear una cuenta nueva</button>
      </section>
    </>
  );
}
