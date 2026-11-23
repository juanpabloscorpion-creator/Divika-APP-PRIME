import Link from 'next/link';
import { ReactNode } from 'react';
import { PieSimple } from './Pie';

// Marco de las pantallas de acceso (diseños "Web · Acceso / Registro / Verificar código / Recuperar contraseña"):
// cabecera sencilla, título de la página y pie corto
export function MarcoAcceso({ titulo, sub, children }: { titulo: string; sub?: string; children: ReactNode }) {
  return (
    <div className="web-pagina acc">
      <header className="web-cab acc-cab">
        <Link href="/" aria-label="Divika, inicio" className="web-cab__logo"><img src="/logo.png" alt="Divika" /></Link>
        <nav className="web-cab__nav" aria-label="Explorar">
          <Link href="/home?todos=1" className="web-cab__enlace web-cab__enlace--fuerte">Explorar servicios</Link>
        </nav>
        <nav className="web-cab__links" aria-label="Principal">
          <Link href="/perfil/soporte" className="web-cab__enlace acc-cab__suave">Ayuda</Link>
          <Link href="/proveedores" className="web-cab__boton">Registrar mi negocio</Link>
        </nav>
      </header>
      <main className="acc-main">
        <div className="acc-ancho">
          <h1 className="acc-titulo">{titulo}</h1>
          {sub && <p className="acc-sub">{sub}</p>}
          {children}
        </div>
      </main>
      <PieSimple corto />
    </div>
  );
}
