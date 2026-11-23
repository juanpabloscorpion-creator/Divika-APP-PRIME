'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cerrarSesion, getUsuario } from '@/lib/auth';
import { cx } from '@/lib/cx';
import type { Usuario } from '@/types';

// Menú de "Mi cuenta" (diseños "Web · Mi perfil", "Mis reservas", "Favoritos"…)
export const MENU_CUENTA = [
  ['/perfil', 'Mi perfil'],
  ['/reservaciones', 'Mis reservas'],
  ['/favoritos', 'Favoritos'],
  ['/perfil/pagos', 'Formas de pago'],
  ['/perfil/seguridad', 'Seguridad'],
  ['/perfil/notificaciones', 'Notificaciones'],
  ['/perfil/privacidad', 'Privacidad'],
  ['/perfil/soporte', 'Ayuda'],
  ['/perfil/reportar', 'Reportar problema'],
  ['/perfil/cuentas', 'Agregar cuenta'],
  ['/perfil/eliminar', 'Eliminar cuenta'],
] as const;

export const esRutaCuenta = (ruta: string) => MENU_CUENTA.some(([h]) => ruta === h || (h !== '/perfil' && ruta.startsWith(h + '/'))) || ruta.startsWith('/perfil');

function activa(ruta: string, href: string) {
  if (href === '/perfil') return ruta === '/perfil' || ruta.startsWith('/perfil/editar');
  return ruta === href || ruta.startsWith(href + '/');
}

export function LateralCuenta() {
  const ruta = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => setUsuario(getUsuario()), [ruta]);
  // En pantallas angostas el menú se desliza de lado: deja visible la opción activa
  useEffect(() => {
    const nav = menu.current;
    const act = nav?.querySelector<HTMLElement>('.cta-menu__item--activo');
    if (nav && act && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = act.offsetLeft - nav.clientWidth / 2 + act.clientWidth / 2;
  }, [ruta]);

  return (
    <aside className="cta-lateral">
      <div className="cta-lateral__cab">
        <small>Mi cuenta</small>
        <strong>{usuario?.nombre ?? ''}</strong>
        <span>{usuario?.rol === 'negocio' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}</span>
      </div>
      <nav ref={menu} className="cta-menu" aria-label="Mi cuenta">
        {MENU_CUENTA.map(([href, texto]) => (
          <Link key={href} href={href} className={cx('cta-menu__item', activa(ruta, href) && 'cta-menu__item--activo')} aria-current={activa(ruta, href) ? 'page' : undefined}>{texto}</Link>
        ))}
      </nav>
      <button type="button" className="cta-salir" onClick={() => { cerrarSesion(); router.push('/'); }}>Cerrar sesión</button>
    </aside>
  );
}

// Título y subtítulo de cada pantalla de la cuenta
export function EncabezadoCuenta({ titulo, sub }: { titulo: string; sub?: ReactNode }) {
  return (
    <div className="cta-encabezado">
      <h1>{titulo}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}

// Botón "Activo ✓ / Inactivo" de los diseños de Notificaciones y Privacidad
export function BotonActivo({ activo, onChange, etiqueta, deshabilitado }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string; deshabilitado?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={deshabilitado} className={cx('cta-activo', activo && 'cta-activo--si')} onClick={() => onChange(!activo)}>
      {activo ? 'Activo ✓' : 'Inactivo'}
    </button>
  );
}

// Fila título + descripción + control
export function FilaAjuste({ titulo, detalle, children }: { titulo: string; detalle?: string; children?: ReactNode }) {
  return (
    <div className="cta-fila">
      <span><strong>{titulo}</strong>{detalle && <small>{detalle}</small>}</span>
      {children}
    </div>
  );
}
