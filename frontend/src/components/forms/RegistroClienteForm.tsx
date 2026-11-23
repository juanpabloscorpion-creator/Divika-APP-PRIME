'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { pedirCodigo, soloDigitos } from '@/lib/codigo';
import { useFormulario } from './useFormulario';

const SEGURA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// "Web · Registro de clientes": crea la cuenta y manda a verificar el teléfono con un código
export function RegistroClienteForm() {
  const router = useRouter();
  const [acepta, setAcepta] = useState(false);
  const { onSubmit, error, cargando } = useFormulario(async (datos) => {
    const telefono = soloDigitos(datos.telefono).slice(-10);
    if (telefono.length < 10) throw new Error('Teléfono inválido. Revisa la lada y los 10 dígitos');
    if (!SEGURA.test(datos.password)) throw new Error('La contraseña debe tener 8 caracteres o más, una mayúscula y un número');
    if (datos.password !== datos.confirmar) throw new Error('Las contraseñas no coinciden');
    if (!acepta) throw new Error('Debes aceptar los Términos y condiciones y el Aviso de privacidad');

    // La sesión no se guarda aquí: se inicia hasta confirmar el código
    await api('/auth/registro/cliente', {
      method: 'POST',
      body: { nombre: datos.nombre, email: datos.email, telefono, password: datos.password },
    });
    try {
      await pedirCodigo('sms', telefono, 'registro');
    } catch {
      throw new Error('Tu cuenta se creó, pero no pudimos enviar el código. Entra con "Iniciar sesión" para recibirlo');
    }
    router.push('/acceso');
  });

  return (
    <form className="acc-form" onSubmit={onSubmit}>
      <label className="acc-campo">Nombre completo *<input name="nombre" required autoComplete="name" placeholder="Mariana López" /></label>
      <label className="acc-campo">Número de teléfono *<input name="telefono" type="tel" inputMode="numeric" required autoComplete="tel-national" placeholder="618 123 4567" /></label>
      <label className="acc-campo">Correo electrónico *<input name="email" type="email" required autoComplete="email" placeholder="mariana.lopez@gmail.com" /></label>
      <label className="acc-campo">Contraseña *<input name="password" type="password" required autoComplete="new-password" /></label>
      <label className="acc-campo">Repetir contraseña *<input name="confirmar" type="password" required autoComplete="new-password" /></label>
      <p className="acc-nota">Usa al menos 8 caracteres, una mayúscula y un número.</p>
      <label className="acc-check"><input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} /> Acepto los Términos y condiciones y el Aviso de privacidad.</label>
      {error && <p className="acc-error" role="alert">{error}</p>}
      <button type="submit" className="acc-btn" disabled={cargando}>{cargando ? 'Creando cuenta…' : <>Crear cuenta y verificar <span aria-hidden>→</span></>}</button>
    </form>
  );
}
