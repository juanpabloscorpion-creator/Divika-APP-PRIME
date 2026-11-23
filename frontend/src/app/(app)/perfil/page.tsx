'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { guardarPendiente, soloDigitos } from '@/lib/codigo';
import { formatoTelefono } from '@/lib/formato';
import { useCuenta } from '@/lib/useCuenta';
import type { Cuenta } from '@/types';

// "Web · Mi perfil"
export default function MiPerfilPage() {
  const router = useRouter();
  const { cuenta, setCuenta, error: errorCarga } = useCuenta();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cuenta) return;
    setNombre(cuenta.nombre);
    setEmail(cuenta.email);
    setTelefono(cuenta.telefono ? formatoTelefono(cuenta.telefono) : '');
    setNacimiento(cuenta.fechaNacimiento ?? '');
    setCiudad(cuenta.ciudad ?? '');
  }, [cuenta]);

  async function foto(f?: File | null) {
    setError('');
    setOk('');
    try {
      if (f) {
        const datos = new FormData();
        datos.append('foto', f);
        setCuenta(await api<Cuenta>('/cuenta/foto', { method: 'POST', body: datos }));
        setOk('Foto actualizada');
      } else {
        setCuenta(await api<Cuenta>('/cuenta/foto', { method: 'DELETE' }));
        setOk('Foto eliminada');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar la foto');
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!cuenta) return;
    setError('');
    setOk('');
    setGuardando(true);
    try {
      setCuenta(await api<Cuenta>('/cuenta', { method: 'PUT', body: { nombre, email, fechaNacimiento: nacimiento || undefined, ciudad } }));
      // Si cambió el teléfono, se confirma con un código antes de guardarlo
      const nuevo = soloDigitos(telefono).slice(-10);
      if (nuevo && nuevo !== soloDigitos(cuenta.telefono ?? '')) {
        const { segundosEspera } = await api<{ segundosEspera: number }>('/cuenta/telefono/codigo', { method: 'POST', body: { telefono: nuevo } });
        guardarPendiente({ canal: 'sms', destino: nuevo, proximoEnvio: Date.now() + segundosEspera * 1000 });
        return router.push('/perfil/editar/codigo');
      }
      setOk('Cambios guardados');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <EncabezadoCuenta titulo="Mi perfil" sub="Mantén actualizados los datos de tu cuenta." />
      {errorCarga && <p className="acc-error">{errorCarga}</p>}
      {cuenta && (
        <form className="acc-tarjeta acc-form" onSubmit={guardar}>
          <div className="cta-perfil-cab">
            {cuenta.avatarUrl ? <img src={cuenta.avatarUrl} alt="" className="cta-avatar" /> : <span className="cta-avatar cta-avatar--letra">{cuenta.nombre.charAt(0)}</span>}
            <h2>{cuenta.nombre}</h2>
            <input ref={archivo} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { foto(e.target.files?.[0]); e.target.value = ''; }} />
            <span className="cta-perfil-cab__botones">
              {cuenta.avatarUrl && <button type="button" className="acc-enlace-boton" onClick={() => foto(null)}>Quitar foto</button>}
              <button type="button" className="acc-btn-borde" onClick={() => archivo.current?.click()}>Cambiar foto</button>
            </span>
          </div>
          <label className="acc-campo">Nombre completo<input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required maxLength={80} /></label>
          <label className="acc-campo">Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label className="acc-campo">Teléfono<input type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="618 123 4567" /></label>
          <p className="acc-nota">{cuenta.telefono && cuenta.telefonoVerificado ? 'Teléfono verificado. ' : ''}Si lo cambias, te enviaremos un código para confirmarlo.</p>
          <label className="acc-campo">Fecha de nacimiento<input type="date" value={nacimiento} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNacimiento(e.target.value)} /></label>
          <label className="acc-campo">Ciudad<input value={ciudad} onChange={(e) => setCiudad(e.target.value)} autoComplete="address-level2" placeholder="Durango" /></label>
          {error && <p className="acc-error" role="alert">{error}</p>}
          {ok && <p className="cta-ok" role="status">{ok}</p>}
          <button type="submit" className="acc-btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </form>
      )}
    </>
  );
}
