'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { MarcoAcceso } from '@/components/web/MarcoAcceso';
import { getUsuario } from '@/lib/auth';

const MAX_MB = 10;

// "Web · Verificar identidad del proveedor". Por ahora solo es la interfaz: los documentos NO se envían
// (falta definir con backend dónde guardarlos de forma privada). Se puede continuar con el alta sin hacerlo.
export default function VerificacionProveedorPage() {
  const router = useRouter();
  const [frente, setFrente] = useState<File | null>(null);
  const [reverso, setReverso] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (getUsuario()?.rol !== 'negocio') router.replace('/proveedores/registro');
  }, [router]);

  const elegir = (set: (f: File | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    setError('');
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) return setError('Sube una foto JPG o PNG.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Cada archivo puede pesar máximo ${MAX_MB} MB.`);
    set(f);
  };

  const documentoListo = !!frente && !!reverso;

  return (
    <MarcoAcceso titulo="Verifica tu identidad" sub="Completa uno de los métodos para continuar con el alta de tu negocio.">
      <div className="acc-dos acc-dos--form">
        <div className="acc-columna">
          <section className="acc-tarjeta">
            <p className="acc-pasos"><span className="hecho">1 · Datos completos</span><span className="activo">2 · Verificación</span></p>
            <h2>Documento oficial</h2>
            <p className="acc-texto">Sube el frente y reverso de tu INE o pasaporte vigente. El nombre debe coincidir con el titular.</p>
            <div className="acc-redes">
              <label className="acc-btn-borde acc-subir">{frente ? `Frente: ${frente.name}` : 'Subir frente del documento'}<input type="file" accept="image/jpeg,image/png" onChange={elegir(setFrente)} hidden /></label>
              <label className="acc-btn-borde acc-subir">{reverso ? `Reverso: ${reverso.name}` : 'Subir reverso del documento'}<input type="file" accept="image/jpeg,image/png" onChange={elegir(setReverso)} hidden /></label>
            </div>
            <p className="acc-nota">JPG o PNG · Hasta {MAX_MB} MB · {documentoListo ? 'Listo para enviar' : 'Sin enviar'}</p>
          </section>

          <section className="acc-tarjeta">
            <h2>Escaneo facial</h2>
            <p className="acc-texto">Usa tu cámara con buena luz y sin objetos que cubran tu rostro.</p>
            <button type="button" className="acc-btn-borde acc-btn-auto" onClick={() => setAviso('El escaneo facial estará disponible pronto. Por ahora usa tu documento oficial.')}>Elegir escaneo facial</button>
          </section>

          {error && <p className="acc-error" role="alert">{error}</p>}
          {aviso && <p className="acc-aviso" role="status">{aviso}</p>}
          {enviado ? (
            <div className="acc-tarjeta acc-aviso-caja" role="status">
              <strong>El envío de documentos estará disponible pronto.</strong>
              <p className="acc-texto">Tus archivos no se enviaron ni se guardaron. Puedes seguir con el alta de tu negocio y verificarte después desde tu portal.</p>
              <Link href="/proveedores/registro" className="acc-btn">Continuar con mi alta <span aria-hidden>→</span></Link>
            </div>
          ) : (
            <>
              <button type="button" className="acc-btn" disabled={!documentoListo} onClick={() => setEnviado(true)}>Enviar a revisión</button>
              <p className="acc-nota">{documentoListo ? 'Tu perfil aún no se publica.' : 'Completa un método antes de enviar. Tu perfil aún no se publica.'} <Link href="/proveedores/registro" className="acc-enlace">Hacerlo después</Link></p>
            </>
          )}
        </div>

        <aside className="acc-panel acc-panel--lista">
          <h2>Tus documentos son privados</h2>
          <p>Solo se usan para validar tu identidad. No aparecen en el perfil público de tu negocio.</p>
          <p>Al enviar: En revisión<br />Plazo orientativo: hasta 24 h.</p>
          <p>Si falta información, podrás volver a intentarlo desde Seguridad.</p>
        </aside>
      </div>
    </MarcoAcceso>
  );
}
