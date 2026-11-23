'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { CodigoInput } from '@/components/forms/CodigoInput';
import { MarcoAcceso } from '@/components/web/MarcoAcceso';
import { api } from '@/lib/api';
import { entrar } from '@/lib/auth';

const SEGURA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// "Web · Recuperar contraseña": 1) correo → código  2) código + contraseña nueva (deja la sesión iniciada)
export default function RecuperarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [pass, setPass] = useState('');
  const [confirma, setConfirma] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function pedir(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api('/auth/recuperar', { method: 'POST', body: { email: email.trim() } });
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setCargando(false);
    }
  }

  async function restablecer(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!SEGURA.test(pass)) return setError('La contraseña debe tener 8 caracteres o más, una mayúscula y un número');
    if (pass !== confirma) return setError('Las contraseñas no coinciden');
    setCargando(true);
    try {
      const s = await entrar('/auth/recuperar/confirmar', { email: email.trim(), codigo, password: pass });
      router.push(s.usuario.rol === 'negocio' ? '/portal' : '/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setCargando(false);
    }
  }

  return (
    <MarcoAcceso titulo="Recupera el acceso a tu cuenta" sub="Te ayudamos a crear una nueva contraseña.">
      <section className="acc-tarjeta acc-tarjeta--centro">
        <h2 className="acc-h2-grande">¿Olvidaste tu contraseña?</h2>
        {!enviado ? (
          <form className="acc-form" onSubmit={pedir}>
            <p className="acc-texto">Ingresa el correo asociado a tu cuenta de cliente o proveedor.</p>
            <label className="acc-campo">Correo de acceso<input type="email" required autoComplete="email" placeholder="mariana.lopez@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {error && <p className="acc-error" role="alert">{error}</p>}
            <button type="submit" className="acc-btn" disabled={cargando || !email.trim()}>{cargando ? 'Enviando…' : 'Enviar código de recuperación'}</button>
            <p className="acc-texto">Por seguridad, si el correo está registrado recibirás un código para restablecer tu contraseña.</p>
          </form>
        ) : (
          <form className="acc-form" onSubmit={restablecer}>
            <p className="acc-texto">Si <strong>{email}</strong> tiene una cuenta, te enviamos un código de 4 dígitos. Escríbelo y elige tu nueva contraseña.</p>
            <CodigoInput cuadrado value={codigo} onChange={(v) => { setCodigo(v); setError(''); }} error={!!error} />
            <label className="acc-campo">Nueva contraseña<input type="password" required autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
            <label className="acc-campo">Repetir contraseña<input type="password" required autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} /></label>
            <p className="acc-nota">Usa al menos 8 caracteres, una mayúscula y un número.</p>
            {error && <p className="acc-error" role="alert">{error}</p>}
            <button type="submit" className="acc-btn" disabled={cargando || codigo.length < 4}>{cargando ? 'Guardando…' : 'Guardar contraseña y entrar'}</button>
            <p className="acc-otros">
              <button type="button" className="acc-enlace-boton" onClick={() => pedir()} disabled={cargando}>Reenviar código</button>
              {' · '}
              <button type="button" className="acc-enlace-boton" onClick={() => { setEnviado(false); setCodigo(''); setError(''); }}>Cambiar correo</button>
            </p>
          </form>
        )}
        <Link href="/login" className="acc-enlace acc-enlace--fuerte acc-volver">Volver a iniciar sesión</Link>
      </section>
    </MarcoAcceso>
  );
}
