'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormulario } from '../forms/useFormulario';
import { IconEye, IconEyeOff } from '../ui/icons';
import { ImagenOpcional } from './ImagenOpcional';
import { MarcoAcceso } from './MarcoAcceso';
import { cerrarSesion, entrar } from '@/lib/auth';

const TEXTOS = {
  usuario: {
    titulo: 'Bienvenido a Divika',
    sub: 'Tus lugares, servicios y reservaciones en un solo lugar.',
    panel: 'Encuentra tu próximo lugar favorito.',
    panelTexto: 'Explora servicios cerca de ti, guarda lo que te gusta y organiza tus citas.',
    imagen: '/web/hero.jpg',
    lema: 'Busca · Conecta · Descubre',
    tarjeta: 'Soy cliente',
    ejemplo: 'mariana.lopez@gmail.com',
    boton: 'Iniciar sesión',
  },
  proveedor: {
    titulo: 'Bienvenido a tu negocio',
    sub: 'Accede al portal de proveedores.',
    panel: 'Tu negocio, más cerca de tus clientes.',
    panelTexto: 'Gestiona tu perfil, servicios, solicitudes y mensajes desde el mismo espacio.',
    imagen: '/web/proveedores.jpg',
    lema: 'Trato directo · Sin comisión',
    tarjeta: 'Soy proveedor',
    ejemplo: 'tunegocio@correo.mx',
    boton: 'Iniciar sesión como proveedor',
  },
};

// Acceso web (diseños "Web · Acceso de clientes" y "Web · Acceso de proveedores")
export function LoginWeb({ tipo }: { tipo: 'usuario' | 'proveedor' }) {
  const router = useRouter();
  const proveedor = tipo === 'proveedor';
  const t = TEXTOS[tipo];
  const [ver, setVer] = useState(false);
  const [aviso, setAviso] = useState('');

  const { onSubmit, error, cargando } = useFormulario(async (datos) => {
    const sesion = await entrar('/auth/login', datos);
    if (proveedor && sesion.usuario.rol !== 'negocio') {
      cerrarSesion();
      throw new Error('Esta cuenta no es de proveedor. Entra desde el acceso de clientes.');
    }
    router.push(sesion.usuario.rol === 'negocio' ? '/portal' : '/home');
  });

  return (
    <MarcoAcceso titulo={t.titulo} sub={t.sub}>
      <div className="acc-dos">
        <aside className="acc-panel">
          <h2>{t.panel}</h2>
          <p>{t.panelTexto}</p>
          <ImagenOpcional src={t.imagen} alt="" className="acc-panel__img" />
          <strong className="acc-panel__lema">{t.lema}</strong>
        </aside>

        <section className="acc-tarjeta">
          <h2>{t.tarjeta}</h2>
          <div className="acc-tabs" role="tablist">
            <button type="button" role="tab" aria-selected className="acc-tab acc-tab--activa">Correo y contraseña</button>
            <Link href={proveedor ? '/acceso?para=proveedor' : '/acceso'} role="tab" aria-selected={false} className="acc-tab">Código por SMS / correo</Link>
          </div>

          <form onSubmit={onSubmit} className="acc-form">
            <label className="acc-campo">
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" placeholder={t.ejemplo} />
            </label>
            <label className="acc-campo">
              Contraseña
              <span className="acc-pass">
                <input name="password" type={ver ? 'text' : 'password'} required autoComplete="current-password" placeholder="Tu contraseña" />
                <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {ver ? <IconEyeOff /> : <IconEye />}
                </button>
              </span>
            </label>
            <Link href="/recuperar" className="acc-enlace">Olvidé mi contraseña</Link>
            {error && <p className="acc-error" role="alert">{error}</p>}
            <button type="submit" className="acc-btn" disabled={cargando}>{cargando ? 'Entrando…' : t.boton}</button>
          </form>

          <p className="acc-o">o continúa con</p>
          <div className="acc-redes">
            <button type="button" className="acc-btn-borde" onClick={() => setAviso('Continuar con Google estará disponible pronto.')}>Google</button>
            <button type="button" className="acc-btn-borde" onClick={() => setAviso('Continuar con Apple estará disponible pronto.')}>Apple</button>
          </div>
          {aviso && <p className="acc-aviso" role="status">{aviso}</p>}

          <div className="acc-pie">
            {proveedor ? (
              <>
                <p>¿Aún no tienes una cuenta de negocio?</p>
                <Link href="/proveedores/registro" className="acc-enlace acc-enlace--fuerte">Registrarme como proveedor <span aria-hidden>→</span></Link>
                <p className="acc-otros"><Link href="/">Busco un servicio</Link> · <Link href="/login">Ir al acceso de clientes</Link></p>
              </>
            ) : (
              <>
                <p>¿Todavía no tienes cuenta?</p>
                <Link href="/registro" className="acc-enlace acc-enlace--fuerte">Crear mi cuenta <span aria-hidden>→</span></Link>
                <p className="acc-otros"><Link href="/proveedores">Tengo un negocio</Link> · <Link href="/login/proveedores">Acceso de proveedores</Link></p>
              </>
            )}
          </div>
        </section>
      </div>
    </MarcoAcceso>
  );
}
