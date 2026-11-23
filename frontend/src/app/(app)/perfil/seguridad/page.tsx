'use client';

import { FormEvent, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { useCuenta } from '@/lib/useCuenta';

const SEGURA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// "Web · Seguridad"
export default function SeguridadPage() {
  const { cuenta } = useCuenta();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cambiar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    if (!SEGURA.test(nueva)) return setError('La contraseña nueva debe tener 8 caracteres o más, una mayúscula y un número');
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden');
    setGuardando(true);
    try {
      await api('/cuenta/contrasena', { method: 'POST', body: { actual, nueva } });
      setOk('Contraseña actualizada');
      setActual(''); setNueva(''); setRepetir('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <EncabezadoCuenta titulo="Seguridad" sub="Protege tu cuenta y mantén tus datos seguros." />
      <div className="cta-dos">
        <section className="acc-tarjeta">
          <h2>Cambiar contraseña</h2>
          {cuenta && !cuenta.tienePassword ? (
            <p className="acc-texto">Entras con código, así que tu cuenta no tiene contraseña que cambiar.</p>
          ) : (
            <form className="acc-form" onSubmit={cambiar}>
              <label className="acc-campo">Contraseña actual<input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" required /></label>
              <label className="acc-campo">Nueva contraseña<input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" required /></label>
              <label className="acc-campo">Confirmar nueva contraseña<input type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" required /></label>
              <p className="acc-nota">Usa al menos 8 caracteres, una mayúscula y un número.</p>
              {error && <p className="acc-error" role="alert">{error}</p>}
              {ok && <p className="cta-ok" role="status">{ok}</p>}
              <button type="submit" className="acc-btn" disabled={guardando || !actual || !nueva}>{guardando ? 'Guardando…' : 'Actualizar contraseña'}</button>
            </form>
          )}
        </section>
        <aside className="acc-panel">
          <h2 className="cta-h2-panel">Seguridad de la cuenta</h2>
          <h3 className="cta-h3">Verificación en dos pasos</h3>
          <p>Un código extra para iniciar sesión.</p>
          <button type="button" className="acc-btn" onClick={() => setAviso('La verificación en dos pasos estará disponible pronto.')}>Activar verificación</button>
          <h3 className="cta-h3">Dispositivos conectados</h3>
          <p>Este navegador.</p>
          <button type="button" className="acc-btn-borde" onClick={() => setAviso('Cerrar sesión en otros dispositivos estará disponible pronto.')}>Cerrar otras sesiones</button>
          {aviso && <p className="acc-aviso" role="status">{aviso}</p>}
        </aside>
      </div>
    </>
  );
}
