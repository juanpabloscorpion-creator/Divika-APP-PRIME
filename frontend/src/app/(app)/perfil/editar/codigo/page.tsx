'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CodigoInput } from '@/components/forms/CodigoInput';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { CodigoPendiente, borrarPendiente, guardarPendiente, leerPendiente } from '@/lib/codigo';
import { formatoTelefono } from '@/lib/formato';
import { useCuenta } from '@/lib/useCuenta';
import type { Cuenta } from '@/types';

export default function CodigoTelefonoPage() {
  const router = useRouter();
  const { setCuenta } = useCuenta();
  const [pendiente, setPendiente] = useState<CodigoPendiente | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const p = leerPendiente();
    if (!p) return router.replace('/perfil');
    setPendiente(p);
  }, [router]);

  useEffect(() => {
    if (!pendiente) return;
    const tick = () => setSegundos(Math.max(0, Math.ceil((pendiente.proximoEnvio - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendiente]);

  if (!pendiente) return null;

  async function confirmar() {
    if (!pendiente) return;
    setError('');
    setCargando(true);
    try {
      setCuenta(await api<Cuenta>('/cuenta/telefono/verificar', { method: 'POST', body: { telefono: pendiente.destino, codigo } }));
      borrarPendiente();
      router.push('/perfil');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
      setCodigo('');
    } finally {
      setCargando(false);
    }
  }

  async function reenviar() {
    if (!pendiente) return;
    setError('');
    try {
      const { segundosEspera } = await api<{ segundosEspera: number }>('/cuenta/telefono/codigo', { method: 'POST', body: { telefono: pendiente.destino } });
      const nuevo = { ...pendiente, proximoEnvio: Date.now() + segundosEspera * 1000 };
      guardarPendiente(nuevo);
      setPendiente(nuevo);
      setCodigo('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
    }
  }

  return (
    <>
      <EncabezadoCuenta titulo="Verifica tu teléfono" sub={<>Ingresa el código que enviamos a <strong>{formatoTelefono(pendiente.destino)}</strong>.</>} />
      <section className="acc-tarjeta acc-codigo">
        <h3>Ingresa el código de 4 dígitos</h3>
        <CodigoInput cuadrado value={codigo} onChange={(v) => { setCodigo(v); setError(''); }} error={!!error} />
        <p className="acc-nota">{segundos > 0 ? <>Puedes solicitar un código nuevo en {segundos} segundos.</> : 'Ya puedes pedir un código nuevo.'}</p>
        <button type="button" className="acc-btn" onClick={confirmar} disabled={codigo.length < 4 || cargando}>{cargando ? 'Verificando…' : 'Confirmar código'}</button>
        <p className="acc-otros">¿No recibiste el código?{' '}<button type="button" className="acc-enlace-boton" onClick={reenviar} disabled={segundos > 0}>Reenviar código</button>{' · '}<button type="button" className="acc-enlace-boton" onClick={() => router.push('/perfil')}>Cancelar</button></p>
        {error && <p className="acc-error" role="alert">{error}</p>}
      </section>
    </>
  );
}
