'use client';

import Link from 'next/link';
import { ImagenOpcional } from './ImagenOpcional';

function Tiendas() {
  return (
    <div className="web-tiendas">
      <span className="web-tienda"><small>Descárgala en</small><strong>App Store</strong></span>
      <span className="web-tienda"><small>Disponible en</small><strong>Google Play</strong></span>
    </div>
  );
}

// Banner "La app de servicios" (imagen armada con el arte del póster de Divika)
export function BannerApp() {
  return (
    <section className="web-banner">
        <ImagenOpcional src="/web/banner-app.jpg" alt="Pareja usando la app de Divika" etiqueta="Imagen: banner-app.jpg" className="web-banner__img" />
        <div className="web-banner__texto">
          <h2><span>DIVIKA</span></h2>
          <p className="web-banner__lema">LA APP DE SERVICIOS</p>
          <p>Descarga la app para celular ya disponible</p>
          <Tiendas />
        </div>
    </section>
  );
}

// Pie sencillo (diseño "Inicio mejorado"). corto = una sola línea (pantallas de acceso)
export function PieSimple({ corto = false, legal = 'Negocios y datos de ejemplo. Confirma precios y disponibilidad con cada establecimiento.' }: { corto?: boolean; legal?: string }) {
  return (
    <footer className={`wa-pie${corto ? ' wa-pie--corto' : ''}`}>
      <div className="wa-pie__fila">
        <span className="wa-pie__marca"><strong>DIVIKA</strong>{corto ? '· ' : ''}Tu comunidad, más cerca.</span>
        <nav className="wa-pie__links" aria-label="Pie de página">
          <Link href="/perfil/soporte">Ayuda</Link>
          <span>Privacidad</span>
          <span>Términos</span>
          {corto ? <span>© 2026 DIVIKA</span> : <Link href="/perfil/soporte">Contacto</Link>}
        </nav>
      </div>
      {!corto && <p className="wa-pie__legal">© 2026 DIVIKA · {legal}</p>}
    </footer>
  );
}
