'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ImagenOpcional } from '@/components/web/ImagenOpcional';
import { BannerApp, PieSimple } from '@/components/web/Pie';
import { getUsuario } from '@/lib/auth';
import type { Usuario } from '@/types';

const MOTIVOS = [
  ['01', 'Más clientes cerca de ti', 'Apareces en las búsquedas de tu colonia y ciudad cuando la gente necesita tu servicio.'],
  ['02', 'Trato directo y sin comisión', 'Tus clientes te contactan directamente, sin intermediarios. Acuerda con ellos el servicio y el pago.'],
  ['03', 'Construye tu reputación', 'Sube fotos de tus trabajos y recibe opiniones de tus clientes para generar más confianza.'],
] as const;

const PASOS = [
  ['01', 'Crea tu perfil', 'Ingresa los datos de tu negocio, horarios y zona de servicio.'],
  ['02', 'Muestra tu trabajo', 'Sube fotos de tus mejores proyectos y los datos de contacto.'],
  ['03', 'Recibe llamadas y mensajes', 'Los clientes te encuentran y te contactan directamente.'],
] as const;

const HERRAMIENTAS = [
  ['Perfil y servicios', 'Actualiza fotos, precios y modalidades.'],
  ['Agenda y solicitudes', 'Revisa cada cita y propone otro horario.'],
  ['Mensajes y reseñas', 'Responde con el contexto de cada cliente.'],
] as const;

// "Vista_Proveedor · Inicio mejorado": landing para atraer negocios
export default function ProveedoresPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  useEffect(() => setUsuario(getUsuario()), []);
  const esNegocio = usuario?.rol === 'negocio';

  return (
    <div className="web-pagina">
      <header className="web-cab">
        <Link href="/" aria-label="Divika, inicio" className="web-cab__logo"><img src="/logo.png" alt="Divika" /></Link>
        <nav className="web-cab__nav" aria-label="Secciones">
          <Link href="/proveedores" className="web-cab__enlace web-cab__enlace--fuerte">Para negocios</Link>
          <a href="#beneficios" className="web-cab__enlace">Beneficios</a>
          <a href="#como-funciona" className="web-cab__enlace">Cómo funciona</a>
        </nav>
        <nav className="web-cab__links" aria-label="Principal">
          <Link href="/" className="web-cab__enlace">Buscar un servicio</Link>
          <Link href={esNegocio ? '/portal' : '/login/proveedores'} className="web-cab__boton">{esNegocio ? 'Mi portal' : 'Iniciar sesión'}</Link>
        </nav>
      </header>

      <section className="ini-hero">
        <div className="ini-ancho ini-hero__grid">
          <div className="ini-hero__texto">
            <p className="ini-ceja">Tu talento merece ser visto</p>
            <h1>Lleva más clientes a tu negocio o servicio local.</h1>
            <p className="prov-desc">Regístrate gratis y conecta con personas de tu zona. Recibe solicitudes directas sin pagar comisiones abusivas.</p>
            <div className="prov-botones">
              <Link href={esNegocio ? '/portal' : '/proveedores/registro'} className="ini-btn">{esNegocio ? 'Ir a mi portal' : 'Registrar mi negocio'} <span aria-hidden>→</span></Link>
              {!esNegocio && <Link href="/login/proveedores" className="prov-btn-borde">Ya tengo una cuenta</Link>}
            </div>
            <p className="prov-chico">Trato directo · Sin comisión · Tú decides cuándo publicar</p>
          </div>
          <aside className="prov-tarjeta">
            <ImagenOpcional src="/web/proveedores.jpg" alt="Personas de distintos oficios trabajando" className="prov-tarjeta__img" />
            <h2>Un espacio para tu negocio</h2>
            <p>Muestra tus servicios, recibe mensajes y organiza tus citas desde un solo lugar.</p>
            <small>Perfil · Servicios · Calendario · Reseñas</small>
          </aside>
        </div>
      </section>

      <section className="ini-seccion" id="beneficios">
        <div className="ini-ancho">
          <h2>¿Por qué anunciarte en Divika?</h2>
          <div className="prov-tarjetas">
            {MOTIVOS.map(([n, t, d]) => (
              <article key={n} className="prov-motivo"><span>{n}</span><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="ini-pasos" id="como-funciona" aria-label="Cómo funciona">
        <div className="ini-ancho"><h2 className="prov-h2">Cómo funciona en 3 pasos</h2></div>
        <ol className="ini-ancho">
          {PASOS.map(([n, t, d]) => (
            <li key={n}><span className="ini-pasos__num">{n}</span><div><h3>{t}</h3><p>{d}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="ini-seccion">
        <div className="ini-ancho">
          <h2>Menos pendientes. Más tiempo para tu trabajo.</h2>
          <div className="prov-tarjetas">
            {HERRAMIENTAS.map(([t, d]) => (
              <article key={t} className="prov-motivo prov-motivo--simple"><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      <BannerApp />
      <PieSimple legal="El cobro de servicios se acuerda directamente con cada cliente." />
    </div>
  );
}
