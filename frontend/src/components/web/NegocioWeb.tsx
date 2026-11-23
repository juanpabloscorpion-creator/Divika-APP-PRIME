'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Estrellas } from '../negocio/Estrellas';
import { IconChat, IconClock, IconHeart, IconHeartFill, IconPhone, IconPin, IconShare } from '../ui/icons';
import { ReservaLinea } from './ReservaLinea';
import { useCategoriaActiva } from './MarcoWeb';
import { api } from '@/lib/api';
import { useCategorias } from '@/lib/categorias';
import { formatoTelefono, numeroWhatsapp } from '@/lib/formato';
import { abiertoAhora, resumenHorario } from '@/lib/horario';
import { NOMBRE_PAGO, pesos } from '@/lib/reservas';
import { useFavoritos } from '@/lib/useFavoritos';
import { textosCategoria } from '@/lib/textosCategoria';
import type { NegocioDetalle, Resena, Servicio } from '@/types';

const ETIQUETA_MODALIDAD = { local: '', domicilio: 'A domicilio', ambos: 'En el negocio o a domicilio' } as const;

export function NegocioWeb({ id }: { id: string }) {
  const router = useRouter();
  const { categorias } = useCategorias();
  const marcarCategoria = useCategoriaActiva();
  const favs = useFavoritos();
  const [negocio, setNegocio] = useState<NegocioDetalle | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [foto, setFoto] = useState(0);

  useEffect(() => {
    api<NegocioDetalle>(`/negocios/${id}`).then(setNegocio).catch((e: Error) => setError(e.message));
    api(`/negocios/${id}/visita`, { method: 'POST' }).catch(() => {});
    api<Servicio[]>(`/negocios/${id}/servicios`).then(setServicios).catch(() => setServicios([]));
    api<Resena[]>(`/resenas/negocio/${id}`).then(setResenas).catch(() => setResenas([]));
  }, [id]);
  useEffect(() => { marcarCategoria(negocio?.categoria ?? null); return () => marcarCategoria(null); }, [negocio?.categoria, marcarCategoria]);

  if (error) return <div className="wa-ancho"><p className="form__error">{error}</p><Link href="/home" className="wa-enlace">Volver al inicio</Link></div>;
  if (!negocio) return null;

  const categoria = categorias.find((c) => c.slug === negocio.categoria);
  const fotos = [negocio.imagenUrl, ...(negocio.galeria ?? [])].filter((u, i, l): u is string => !!u && l.indexOf(u) === i);
  const horario = resumenHorario(negocio.horariosJson);
  const abierto = abiertoAhora(negocio.horariosJson);
  const esFav = favs.esFavorito(negocio.id);
  const t = textosCategoria(negocio.categoria);
  const comoLlegar = negocio.latitud != null && negocio.longitud != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${negocio.latitud},${negocio.longitud}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([negocio.direccion, negocio.ciudad].filter(Boolean).join(', '))}`;
  const contar = (tipo: 'whatsapp' | 'llamada') => { api(`/negocios/${id}/clic-${tipo}`, { method: 'POST' }).catch(() => {}); };
  const lugar = [negocio.colonia, negocio.ciudad].filter(Boolean).join(' · ') || negocio.direccion;

  async function compartir() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: negocio?.nombre, url });
      else { await navigator.clipboard.writeText(url); setAviso('Enlace copiado'); setTimeout(() => setAviso(''), 2500); }
    } catch {}
  }

  return (
    <div className="wa-ancho">
      <nav className="wa-migas" aria-label="Ruta">
        <Link href="/home">Inicio</Link><span>›</span><span>Categorías</span><span>›</span>
        {categoria ? <Link href={`/categoria/${categoria.slug}`}>{categoria.nombre}</Link> : <span>{negocio.categoria}</span>}<span>›</span><strong>{negocio.nombre}</strong>
      </nav>

      <header className="wa-ficha__cab">
        <div>
          <p className="wa-eyebrow">{[categoria?.nombre ?? negocio.categoria, negocio.subcategoria].filter(Boolean).join(' / ')}</p>
          <h1>{negocio.nombre}</h1>
          <p className="wa-ficha__meta">
            <span><Estrellas valor={negocio.calificacion} /> <strong>{negocio.calificacion.toFixed(1)}</strong> {resenas.length} reseña{resenas.length === 1 ? '' : 's'}</span>
            <span><IconPin /> {lugar}</span>
            {negocio.distanciaKm != null && <span>{negocio.distanciaKm.toFixed(1)} km</span>}
            {abierto !== null && <span className={`chip-estado${abierto ? '' : ' chip-estado--cerrado'}`}>{abierto ? 'Abierto ahora' : 'Cerrado'}</span>}
          </p>
        </div>
        <div className="wa-ficha__acciones">
          <button type="button" className="wa-btn-borde" onClick={compartir}><IconShare /> Compartir</button>
          <button type="button" className="wa-btn-borde" aria-pressed={esFav} onClick={() => (esFav ? favs.quitar(negocio.id) : favs.agregar(negocio))}>{esFav ? <IconHeartFill /> : <IconHeart />} {esFav ? 'Guardado' : 'Guardar'}</button>
        </div>
      </header>

      <section className={`wa-galeria${fotos.length < 2 ? ' wa-galeria--sola' : ''}`} aria-label="Fotos">
        {fotos.length === 0 ? <div className="wa-galeria__vacia">Este negocio aún no tiene fotos</div> : (
          <>
            <img className="wa-galeria__principal" src={fotos[foto] ?? fotos[0]} alt={negocio.nombre} />
            {fotos.length > 1 && (
              <div className="wa-galeria__lado">
                {fotos.map((u, i) => i !== foto && (
                  <button key={u} type="button" aria-label={`Ver foto ${i + 1}`} onClick={() => setFoto(i)}><img src={u} alt="" /></button>
                )).filter(Boolean).slice(0, 2)}
              </div>
            )}
          </>
        )}
      </section>

      <nav className="wa-tabs" aria-label="Secciones">
        <a href="#info">Información</a>
        {servicios.length > 0 && <a href="#servicios">{t.servicios}</a>}
        <a href="#ubicacion">Ubicación y horarios</a>
        <a href="#resenas">Reseñas</a>
      </nav>

      <div className="wa-ficha">
        <div className="wa-ficha__col">
          <section className="wa-bloque" id="info">
            <h2 className="wa-bloque__lema">{negocio.descripcionCorta ?? negocio.nombre}</h2>
            {negocio.descripcion && <p>{negocio.descripcion}</p>}
            {negocio.atiendeDomicilio && <p className="wa-chips"><span className="wa-chip">✓ Atiende a domicilio</span></p>}
          </section>

          {servicios.length > 0 && (
            <section className="wa-bloque" id="servicios">
              <div className="wa-bloque__cab"><h2>{t.servicios}</h2><small>Precios en MXN</small></div>
              {servicios.map((s) => (
                <div key={s.id} className="wa-servicio">
                  {s.fotoUrl && <img src={s.fotoUrl} alt="" />}
                  <div>
                    <strong>{s.nombre}</strong>
                    <small>{[s.categoria, `${s.duracionMin} min`, ETIQUETA_MODALIDAD[s.modalidad], s.modalidad !== 'local' && s.costoTraslado ? `traslado ${pesos(s.costoTraslado)}` : '', s.descripcion].filter(Boolean).join(' · ')}</small>
                    {s.indicaciones && <small>{s.indicaciones}</small>}
                  </div>
                  <strong className="wa-servicio__precio">{pesos(s.precio)}</strong>
                </div>
              ))}
            </section>
          )}

          <section className="wa-bloque" id="ubicacion">
            <h2>Ubicación y horarios</h2>
            <div className="wa-ubic">
              <div className="wa-ubic__mapa">
                <MapaIlustrado />
                <a className="wa-ubic__llegar" href={comoLlegar} target="_blank" rel="noreferrer">Cómo llegar <span aria-hidden>↗</span></a>
              </div>
              <div>
                <p className="wa-ubic__titulo"><IconClock /> Horario de atención</p>
                {horario.length === 0 ? <p className="wa-nota">El negocio aún no capturó su horario.</p> : horario.map((l) => <p key={l} className="wa-ubic__linea">{l}</p>)}
                <p className="wa-nota">La agenda muestra solo los espacios disponibles.</p>
              </div>
            </div>
            <p className="wa-ubic__dir"><IconPin /> {negocio.direccion}</p>
            {negocio.referencias && <p className="wa-nota">{negocio.referencias}</p>}
          </section>

          <div className="wa-dos-bloques">
            <section className="wa-bloque">
              <h2>Habla con el proveedor</h2>
              <button type="button" className="wa-btn-borde wa-btn-borde--block" onClick={() => router.push(`/negocio/${negocio.id}/mensajes`)}><IconChat /> Enviar mensaje</button>
              <a className="wa-enlace wa-enlace--fila" href={`https://wa.me/${numeroWhatsapp(negocio.telefono)}`} target="_blank" rel="noreferrer" onClick={() => contar('whatsapp')}><IconChat /> WhatsApp</a>
              <a className="wa-enlace wa-enlace--fila" href={`tel:${negocio.telefono}`} onClick={() => contar('llamada')}><IconPhone /> {formatoTelefono(negocio.telefono)}</a>
            </section>
            <section className="wa-bloque">
              <h2>Formas de pago</h2>
              {negocio.metodosPago?.length ? (
                <>
                  <p className="wa-chips">{negocio.metodosPago.map((m) => <span key={m} className="wa-chip">{NOMBRE_PAGO[m] ?? m}</span>)}</p>
                  {negocio.instruccionesPago && <p className="wa-nota">{negocio.instruccionesPago}</p>}
                </>
              ) : <p className="wa-nota">El negocio no indicó formas de pago.</p>}
              <p className="wa-nota">Divika no procesa pagos: se acuerdan directamente con el negocio.</p>
            </section>
          </div>

          <section className="wa-bloque" id="resenas">
            <div className="wa-bloque__cab"><h2>Lo que dice la comunidad</h2>{resenas.length > 0 && <span className="wa-calif">★ {negocio.calificacion.toFixed(1)} / 5</span>}</div>
            {resenas.length === 0 ? <p className="wa-nota">Aún no hay reseñas.</p> : (
              <div className="wa-resenas">
                {resenas.map((r) => (
                  <article key={r.id} className="wa-resena">
                    <div className="wa-resena__cab"><span className="wa-avatar">{r.usuario.nombre.charAt(0).toUpperCase()}</span><div><strong>{r.usuario.nombre}</strong><small>{new Date(r.creadoEn).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</small></div><Estrellas valor={r.calificacion} /></div>
                    {r.comentario && <p>{r.comentario}</p>}
                    {r.respuesta && <p className="wa-resena__resp"><strong>Respuesta del negocio:</strong> {r.respuesta}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <ReservaLinea negocio={negocio} servicios={servicios} />
      </div>
      {aviso && <div className="toast" role="status">{aviso}</div>}
    </div>
  );
}

// Mapa ilustrado (sin cargar Google Maps): calles, un parque y el pin del negocio
function MapaIlustrado() {
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Mapa ilustrativo de la ubicación" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="200" fill="#eceaf6" />
      <rect x="196" y="18" width="92" height="62" rx="10" fill="#d9ecd9" />
      <rect x="22" y="126" width="70" height="52" rx="10" fill="#d9ecd9" />
      <g stroke="#fff" strokeLinecap="round" fill="none">
        <path d="M-10 100 H330" strokeWidth="16" />
        <path d="M150 -10 V210" strokeWidth="14" />
        <path d="M-10 40 L120 60 L330 150" strokeWidth="9" />
        <path d="M60 -10 V210" strokeWidth="7" />
        <path d="M250 100 V210" strokeWidth="7" />
      </g>
      <path d="M150 -10 V210" fill="none" stroke="#d7d3ee" strokeWidth="2" strokeDasharray="8 8" />
      <circle cx="150" cy="108" r="22" fill="#4b3f8f" opacity=".14" />
      <path d="M150 112 c-12-14-18-22-18-30 a18 18 0 0 1 36 0 c0 8-6 16-18 30z" fill="#4b3f8f" />
      <circle cx="150" cy="82" r="6.5" fill="#fff" />
    </svg>
  );
}
