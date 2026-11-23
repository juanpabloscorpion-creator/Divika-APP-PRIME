'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { useCategorias } from '@/lib/categorias';
import { useFavoritos } from '@/lib/useFavoritos';
import type { Negocio } from '@/types';

// "Web · Favoritos", "Favoritos vacíos" y "Último favorito eliminado"
export default function FavoritosPage() {
  const { lista, agregar, quitar, error, setError } = useFavoritos();
  const { categorias } = useCategorias();
  const [top, setTop] = useState<Negocio[]>([]);
  const [eliminado, setEliminado] = useState<{ n: Negocio; ultimo: boolean } | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { api<Negocio[]>('/negocios/top').then((l) => setTop(l.slice(0, 3))).catch(() => setTop([])); }, []);

  const tipo = (n: Negocio) => n.subcategoria ?? categorias.find((c) => c.slug === n.categoria)?.nombre ?? n.categoria;

  function quitarConAviso(n: Negocio) {
    const ultimo = (lista?.length ?? 0) === 1;
    quitar(n.id);
    setEliminado({ n, ultimo });
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setEliminado(null), 6000);
  }

  const foto = (n: Negocio) => <div className="cta-fav__foto">{n.imagenUrl ? <img src={n.imagenUrl} alt="" /> : <span>{n.nombre.charAt(0)}</span>}</div>;

  return (
    <>
      <EncabezadoCuenta titulo="Mis favoritos" sub="Tus lugares favoritos en un solo lugar." />
      {error && <p className="acc-error" role="alert">{error}</p>}

      {lista && lista.length > 0 && (
        <>
          <p className="cta-contador">{lista.length} {lista.length === 1 ? 'lugar guardado' : 'lugares guardados'}</p>
          <div className="cta-favs">
            {lista.map((n) => (
              <article key={n.id} className="cta-fav">
                {foto(n)}
                <div className="cta-fav__cuerpo">
                  <small>{tipo(n)}</small>
                  <h3>{n.nombre}</h3>
                  <p>★ {n.calificacion ? n.calificacion.toFixed(1) : 'Sin reseñas'}</p>
                  <Link href={`/negocio/${n.id}`} className="acc-btn">Ver detalles <span aria-hidden>→</span></Link>
                  <button type="button" className="acc-enlace-boton" onClick={() => quitarConAviso(n)}>Quitar de favoritos</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {lista && lista.length === 0 && (
        <>
          <div className="acc-panel cta-vacio">
            <h2>¡Aún no tienes favoritos!</h2>
            <p>Descubre establecimientos y guarda los que más te gusten. Cuando vuelvas, estarán aquí.</p>
            <Link href="/home?todos=1" className="acc-btn cta-btn-auto">Explorar servicios <span aria-hidden>→</span></Link>
          </div>
          {top.length > 0 && (
            <>
              <h2 className="cta-h2">Los mejor calificados para ti</h2>
              <div className="cta-favs">
                {top.map((n) => (
                  <article key={n.id} className="cta-fav">
                    {foto(n)}
                    <div className="cta-fav__cuerpo">
                      <h3>{n.nombre}</h3>
                      <p>{tipo(n)}{n.calificacion ? ` · ${n.calificacion.toFixed(1)}` : ''}</p>
                      <Link href={`/negocio/${n.id}`} className="acc-btn-borde">Ver detalles <span aria-hidden>→</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {eliminado && (
        <div className="cta-toast" role="status">
          <span>{eliminado.ultimo ? 'Eliminaste tu último favorito' : `Quitaste ${eliminado.n.nombre} de favoritos`}</span>
          <button type="button" onClick={() => { agregar(eliminado.n); setEliminado(null); setError(''); }}>Deshacer</button>
        </div>
      )}
    </>
  );
}
