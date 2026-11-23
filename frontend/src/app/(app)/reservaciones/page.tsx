'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { ESTADO_CITA, fechaLarga, vigente } from '@/lib/reservas';
import { cx } from '@/lib/cx';
import type { Cita } from '@/types';

type Pestana = 'proximas' | 'anteriores' | 'canceladas';
const cancelada = (c: Cita) => c.estado === 'cancelada' || c.estado === 'rechazada';
const pesos = (n: number) => `$${n.toLocaleString('es-MX')} MXN`;

// "Web · Mis reservas": próximas, anteriores y canceladas (con datos reales del cliente)
export default function MisReservasPage() {
  const [lista, setLista] = useState<Cita[] | null>(null);
  const [pestana, setPestana] = useState<Pestana>('proximas');
  const [error, setError] = useState('');
  const cargar = useCallback(() => api<Cita[]>('/citas/mias').then(setLista).catch((e: Error) => { setError(e.message); setLista([]); }), []);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(id: string, ruta: 'cancelar' | 'aceptar-propuesta') {
    setError('');
    try {
      await api(`/citas/${id}/${ruta}`, { method: 'POST' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar');
    }
  }

  const orden = (a: Cita, b: Cita) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`);
  const proximas = (lista ?? []).filter(vigente).sort(orden);
  const anteriores = (lista ?? []).filter((c) => !vigente(c) && !cancelada(c)).sort((a, b) => orden(b, a));
  const canceladas = (lista ?? []).filter(cancelada).sort((a, b) => orden(b, a));
  const visibles = pestana === 'proximas' ? proximas : pestana === 'anteriores' ? anteriores : canceladas;

  const tarjeta = (c: Cita) => (
    <article key={c.id} className="acc-tarjeta cta-reserva">
      <div className="cta-reserva__foto">{c.negocio.imagenUrl ? <img src={c.negocio.imagenUrl} alt="" /> : <span>{c.negocio.nombre.charAt(0)}</span>}</div>
      <div className="cta-reserva__cuerpo">
        <h2>{c.negocio.nombre}</h2>
        <p className="cta-reserva__sub">{c.servicio?.nombre ?? 'Cita'} · <span className={cx('cta-estado', `cta-estado--${c.estado}`)}>{ESTADO_CITA[c.estado]}</span></p>
        <p>{fechaLarga(c.fecha)} · {c.hora} h</p>
        <p>{c.personas} {c.personas === 1 ? 'persona' : 'personas'}{c.servicio?.precio != null ? ` · Precio: ${pesos(c.servicio.precio)}` : ''}{c.metodoPago ? ` · Pago: ${c.metodoPago}` : ''}</p>
        {c.estado === 'propuesta' && c.propuestaFecha && <p className="cta-reserva__propuesta"><strong>El negocio propone:</strong> {fechaLarga(c.propuestaFecha)} · {c.propuestaHora} h</p>}
        <div className="cta-reserva__acciones">
          {c.estado === 'propuesta' ? (
            <button type="button" className="acc-btn" onClick={() => accion(c.id, 'aceptar-propuesta')}>Aceptar nuevo horario</button>
          ) : (
            <Link href={`/negocio/${c.negocio.id}`} className="acc-btn">{pestana === 'proximas' ? 'Ver detalles' : 'Volver a agendar'}</Link>
          )}
          <Link href={`/negocio/${c.negocio.id}/mensajes`} className="acc-btn-borde">Escribir al negocio</Link>
          {vigente(c) && <button type="button" className="acc-enlace-boton cta-peligro" onClick={() => accion(c.id, 'cancelar')}>Cancelar cita</button>}
        </div>
      </div>
    </article>
  );

  const vacio = { proximas: 'No tienes citas próximas.', anteriores: 'Aún no tienes citas anteriores.', canceladas: 'No tienes citas canceladas.' }[pestana];

  return (
    <>
      <EncabezadoCuenta titulo="Mis reservas" sub="Organiza tus citas y consulta el historial." />
      <div className="acc-tabs cta-tabs3" role="tablist">
        {([['proximas', 'Próximas', proximas.length], ['anteriores', 'Anteriores', anteriores.length], ['canceladas', 'Canceladas', canceladas.length]] as const).map(([id, t, n]) => (
          <button key={id} type="button" role="tab" aria-selected={pestana === id} className={cx('acc-tab', pestana === id && 'acc-tab--activa')} onClick={() => setPestana(id)}>{t}{lista ? ` (${n})` : ''}</button>
        ))}
      </div>
      {error && <p className="acc-error" role="alert">{error}</p>}
      {lista && visibles.length === 0 && (
        <div className="acc-panel cta-vacio">
          <h2>{vacio}</h2>
          <p>Entra a un negocio y elige fecha y hora para reservar.</p>
          <Link href="/home?todos=1" className="acc-btn cta-btn-auto">Explorar servicios <span aria-hidden>→</span></Link>
        </div>
      )}
      <div className="cta-lista">{visibles.map(tarjeta)}</div>
      {pestana === 'proximas' && anteriores.length > 0 && (
        <section className="acc-tarjeta">
          <h2>Agendadas anteriormente</h2>
          {anteriores.slice(0, 3).map((c) => (
            <div key={c.id} className="cta-anterior">
              <div><strong>{c.negocio.nombre}{c.servicio ? ` · ${c.servicio.nombre}` : ''}</strong><p>{fechaLarga(c.fecha)} · {c.hora} h{c.servicio?.precio != null ? ` · ${pesos(c.servicio.precio)}` : ''}</p></div>
              <Link href={`/negocio/${c.negocio.id}`} className="acc-btn-borde">Volver a agendar</Link>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
