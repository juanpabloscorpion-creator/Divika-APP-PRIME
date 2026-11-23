'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { CodigoInput } from '@/components/forms/CodigoInput';
import { MarcoAcceso } from '@/components/web/MarcoAcceso';
import { entrar } from '@/lib/auth';
import { Canal, CodigoPendiente, borrarPendiente, leerPendiente, pedirCodigo, soloDigitos } from '@/lib/codigo';

// "Web · Verificar código": se pide el código y se escribe en la misma página.
// Sirve para entrar con código (clientes y proveedores, ?para=proveedor) y para verificar el teléfono al registrarse.
export default function VerificarCodigoPage() {
  const router = useRouter();
  const [canal, setCanal] = useState<Canal>('sms');
  const [destino, setDestino] = useState('');
  const [pendiente, setPendiente] = useState<CodigoPendiente | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const esSms = canal === 'sms';

  // Si ya se pidió un código en esta pestaña (por ejemplo, al registrarse), se continúa ahí
  useEffect(() => {
    const p = leerPendiente();
    if (p) {
      setCanal(p.canal);
      setDestino(p.destino);
      setPendiente(p);
    }
  }, []);

  useEffect(() => {
    if (!pendiente) return;
    const tick = () => setSegundos(Math.max(0, Math.ceil((pendiente.proximoEnvio - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendiente]);

  function cambiarCanal(c: Canal) {
    if (c === canal) return;
    setCanal(c);
    setDestino('');
    setPendiente(null);
    setCodigo('');
    setError('');
    borrarPendiente();
  }

  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    const valor = esSms ? soloDigitos(destino).slice(-10) : destino.trim();
    if (esSms && valor.length !== 10) return setError('Si el número no es válido, revisa la lada y los 10 dígitos.');
    if (!esSms && !/^\S+@\S+\.\S+$/.test(valor)) return setError('Escribe un correo válido.');
    setCargando(true);
    try {
      setPendiente(await pedirCodigo(canal, valor, pendiente?.origen ?? 'acceso'));
      setCodigo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    if (!pendiente) return;
    setError('');
    setCargando(true);
    try {
      const sesion = await entrar('/auth/codigo/verificar', { canal: pendiente.canal, destino: pendiente.destino, codigo });
      borrarPendiente();
      if (pendiente.origen === 'registro') router.push('/verificado');
      else router.push(sesion.usuario.rol === 'negocio' ? '/portal' : '/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
      setCodigo('');
    } finally {
      setCargando(false);
    }
  }

  function cambiarDestino() {
    setPendiente(null);
    setCodigo('');
    setError('');
    borrarPendiente();
  }

  const final = esSms ? soloDigitos(pendiente?.destino ?? '').slice(-4) : pendiente?.destino;

  return (
    <MarcoAcceso titulo="Verifica tu cuenta" sub="Elige cómo quieres recibir el código de acceso.">
      <section className="acc-tarjeta acc-tarjeta--centro">
        <div className="acc-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={esSms} className={`acc-tab${esSms ? ' acc-tab--activa' : ''}`} onClick={() => cambiarCanal('sms')}>Mensaje SMS</button>
          <button type="button" role="tab" aria-selected={!esSms} className={`acc-tab${!esSms ? ' acc-tab--activa' : ''}`} onClick={() => cambiarCanal('email')}>Correo electrónico</button>
        </div>

        <form className="acc-form" onSubmit={enviar} noValidate>
          <label className="acc-campo">
            {esSms ? 'Número de teléfono' : 'Correo electrónico'}
            {esSms ? (
              <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="618 123 4567" value={destino} onChange={(e) => setDestino(e.target.value)} disabled={!!pendiente} />
            ) : (
              <input type="email" autoComplete="email" placeholder="tucorreo@gmail.com" value={destino} onChange={(e) => setDestino(e.target.value)} disabled={!!pendiente} />
            )}
          </label>
          {!pendiente && (
            <button type="submit" className="acc-btn" disabled={cargando || !destino.trim()}>
              {cargando ? 'Enviando…' : esSms ? 'Recibir código por SMS' : 'Recibir código por correo'}
            </button>
          )}
        </form>

        {pendiente && (
          <div className="acc-codigo">
            <p className="acc-codigo__enviado">
              {esSms ? <>Enviamos un código a tu teléfono terminado en {final}.</> : <>Enviamos un código a {final}.</>}
            </p>
            <h3>Ingresa el código de 4 dígitos</h3>
            <CodigoInput cuadrado value={codigo} onChange={(v) => { setCodigo(v); setError(''); }} error={!!error} />
            <p className="acc-nota">
              {segundos > 0 ? <>Puedes solicitar un código nuevo en {segundos} segundos.</> : 'Ya puedes pedir un código nuevo.'}
            </p>
            <button type="button" className="acc-btn" onClick={confirmar} disabled={codigo.length < 4 || cargando}>
              {cargando ? 'Verificando…' : 'Confirmar código'}
            </button>
            <p className="acc-otros">
              ¿No recibiste el código?{' '}
              <button type="button" className="acc-enlace-boton" onClick={() => enviar()} disabled={segundos > 0 || cargando}>Reenviar código</button>
              {' · '}
              <button type="button" className="acc-enlace-boton" onClick={cambiarDestino}>{esSms ? 'Cambiar número' : 'Cambiar correo'}</button>
            </p>
          </div>
        )}

        {error && <p className="acc-error" role="alert">{error}</p>}
      </section>
    </MarcoAcceso>
  );
}
