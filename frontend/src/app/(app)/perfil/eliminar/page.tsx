'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { cerrarSesion } from '@/lib/auth';

// "Web · Eliminar cuenta"
export default function EliminarCuentaPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(false);

  async function eliminar() {
    setError('');
    setBorrando(true);
    try {
      await api('/cuenta', { method: 'DELETE' });
      cerrarSesion();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta');
      setBorrando(false);
    }
  }

  return (
    <>
      <EncabezadoCuenta titulo="Eliminar cuenta" sub="Revisa la información antes de continuar." />
      <section className="acc-tarjeta cta-eliminar">
        <h2 className="acc-h2-grande">¿Quieres eliminar tu cuenta?</h2>
        <p className="cta-peligro-texto">Esta acción es permanente y no se puede deshacer.</p>
        <div><h3 className="cta-h3">Perderás tu información</h3><p className="acc-texto">Se borran tus datos de perfil, tu foto, tus favoritos y tus reseñas.</p></div>
        <div><h3 className="cta-h3">No podrás recuperar tu historial</h3><p className="acc-texto">Tus reservas y favoritos dejarán de estar disponibles para ti.</p></div>
        <div><h3 className="cta-h3">Revisa tus reservas pendientes</h3><p className="acc-texto">Cancela o confirma tus citas con cada negocio antes de eliminar la cuenta.</p></div>
        <p className="acc-nota">Los negocios conservan el registro de las citas que tuviste con ellos, a nombre de “Cuenta eliminada”.</p>
        {error && <p className="acc-error" role="alert">{error}</p>}
        <div className="acc-redes">
          <button type="button" className="acc-btn-borde" onClick={() => router.push('/perfil')}>Cancelar</button>
          <button type="button" className="acc-btn cta-btn-peligro" disabled={borrando} onClick={eliminar}>{borrando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}</button>
        </div>
      </section>
    </>
  );
}
