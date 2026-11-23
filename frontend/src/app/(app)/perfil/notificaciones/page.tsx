'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BotonActivo, EncabezadoCuenta, FilaAjuste } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import type { Preferencias } from '@/types';

type Clave = keyof Preferencias['notificaciones'];
const CANALES: [Clave, string, string][] = [
  ['push', 'Avisos del navegador', 'Notificaciones web en este dispositivo.'],
  ['correo', 'Correo electrónico', 'Avisos en tu correo.'],
  ['sms', 'Mensajes SMS', 'Avisos al número registrado.'],
  ['recordatorios', 'Recordatorios de reservas', 'Antes de tus próximas citas.'],
  ['promociones', 'Promociones y descuentos', 'Ofertas que pueden interesarte.'],
  ['novedades', 'Novedades de Divika', 'Nuevas funciones y servicios.'],
];
type Aviso = { id: string; titulo: string; detalle: string | null; enlace: string | null; leida: boolean };

// "Web · Notificaciones y preferencias"
export default function NotificacionesPage() {
  const [prefs, setPrefs] = useState<Preferencias['notificaciones'] | null>(null);
  const [avisos, setAvisos] = useState<{ noLeidas: number; items: Aviso[] } | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api<Preferencias>('/cuenta/preferencias').then((p) => setPrefs(p.notificaciones)).catch((e: Error) => setError(e.message));
    api<{ noLeidas: number; items: Aviso[] }>('/notificaciones').then(setAvisos).catch(() => setAvisos({ noLeidas: 0, items: [] }));
  }, []);

  async function guardar() {
    if (!prefs) return;
    setError(''); setOk(''); setGuardando(true);
    try {
      const p = await api<Preferencias>('/cuenta/preferencias', { method: 'PUT', body: { notificaciones: prefs } });
      setPrefs(p.notificaciones);
      setOk('Preferencias guardadas');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function leerTodas() {
    await api('/notificaciones/leer-todas', { method: 'POST' }).catch(() => {});
    setAvisos((a) => a && { noLeidas: 0, items: a.items.map((i) => ({ ...i, leida: true })) });
  }

  const ultimo = avisos?.items[0];

  return (
    <>
      <EncabezadoCuenta titulo="Notificaciones y preferencias" sub="Elige qué avisos recibir y revisa tus novedades." />
      <div className="cta-dos">
        <section className="acc-tarjeta">
          <h2>Canales de notificación</h2>
          {CANALES.map(([clave, t, d]) => (
            <FilaAjuste key={clave} titulo={t} detalle={d}>
              <BotonActivo activo={!!prefs?.[clave]} etiqueta={t} deshabilitado={!prefs} onChange={(v) => { setOk(''); setPrefs((p) => p && { ...p, [clave]: v }); }} />
            </FilaAjuste>
          ))}
          <p className="acc-nota">Los avisos de seguridad siempre estarán activos. Por ahora los avisos llegan dentro de Divika; el envío por correo y SMS se activará pronto.</p>
          {error && <p className="acc-error" role="alert">{error}</p>}
          {ok && <p className="cta-ok" role="status">{ok}</p>}
          <button type="button" className="acc-btn" disabled={!prefs || guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar preferencias'}</button>
        </section>
        <aside className="acc-tarjeta cta-avisos">
          <h2>Tus avisos</h2>
          {!avisos ? null : ultimo ? (
            <>
              <strong className="cta-avisos__titulo">{ultimo.titulo}</strong>
              {ultimo.detalle && <p className="acc-texto">{ultimo.detalle}</p>}
              {ultimo.enlace && <Link href={ultimo.enlace} className="acc-enlace acc-enlace--fuerte">Ver <span aria-hidden>→</span></Link>}
              <p className="acc-nota">{avisos.noLeidas ? `${avisos.noLeidas} sin leer` : 'Todo leído'}</p>
              {avisos.noLeidas > 0 && <button type="button" className="acc-enlace-boton" onClick={leerTodas}>Marcar todas como leídas</button>}
            </>
          ) : (
            <p className="acc-texto">Aún no tienes avisos. Aquí verás cuando un negocio confirme tu cita o te responda.</p>
          )}
        </aside>
      </div>
    </>
  );
}
