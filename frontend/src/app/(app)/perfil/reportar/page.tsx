'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { getUsuario } from '@/lib/auth';
import { cx } from '@/lib/cx';

const TIPOS = [
  ['aplicacion', 'Error en el sitio web'],
  ['reserva', 'Problema con una reserva'],
  ['pagos', 'Pagos y cobros'],
  ['cancelaciones', 'Cancelaciones y reembolsos'],
  ['servicio', 'Problema con el servicio'],
  ['otro', 'Otro'],
] as const;

// "Web · Reportar un problema" (se guarda en support_reports)
export default function ReportarPage() {
  const [tipo, setTipo] = useState<string>('');
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [email, setEmail] = useState('');
  useEffect(() => setEmail(getUsuario()?.email ?? ''), []);
  const nombreTipo = TIPOS.find(([id]) => id === tipo)?.[1] ?? '';

  async function enviar() {
    setError('');
    if (!tipo) return setError('Selecciona una categoría.');
    if (texto.trim().length < 5) return setError('Cuéntanos un poco más del problema.');
    setEnviando(true);
    try {
      await api('/soporte/reportes', { method: 'POST', body: { tipo, descripcion: texto.trim() } });
      setListo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el reporte');
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <>
        <EncabezadoCuenta titulo="Reportar un problema" />
        <section className="acc-tarjeta acc-listo">
          <svg className="acc-listo__check" viewBox="0 0 24 24" width="36" height="36" aria-hidden><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <h2>Recibimos tu reporte</h2>
          <p className="acc-texto">Gracias por avisarnos. Te responderemos a {email}.</p>
          <Link href="/perfil/soporte" className="acc-btn cta-btn-auto">Volver a Ayuda</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <EncabezadoCuenta titulo="Reportar un problema" sub="Describe lo que ocurrió para que podamos revisarlo." />
      <div className="cta-dos">
        <section className="acc-tarjeta acc-form">
          <label className="acc-campo">Tipo de problema<input readOnly value={nombreTipo} placeholder="Elige una categoría a la derecha" /></label>
          <label className="acc-campo">Describe el problema
            <textarea className="cta-textarea" value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Al abrir el detalle de mi reserva, la pantalla se queda en blanco." />
          </label>
          <p className="acc-nota">{texto.length} / 1000 caracteres</p>
          <h3 className="cta-h3">Captura de pantalla (opcional)</h3>
          <button type="button" className="acc-btn-borde" onClick={() => setAviso('Adjuntar imágenes estará disponible pronto.')}>Adjuntar imagen</button>
          <p className="acc-nota">JPG o PNG · Máximo 10 MB</p>
          {aviso && <p className="acc-aviso" role="status">{aviso}</p>}
          <p className="acc-texto">Te responderemos a {email}. No incluyas contraseñas ni datos bancarios.</p>
          {error && <p className="acc-error" role="alert">{error}</p>}
          <button type="button" className="acc-btn" disabled={enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Enviar reporte'}</button>
        </section>
        <aside className="acc-panel">
          <h2 className="cta-h2-panel">Selecciona una categoría</h2>
          <div className="cta-radios" role="radiogroup" aria-label="Tipo de problema">
            {TIPOS.map(([id, t]) => (
              <button key={id} type="button" role="radio" aria-checked={tipo === id} className={cx('cta-radio', tipo === id && 'cta-radio--si')} onClick={() => { setTipo(id); setError(''); }}>
                <span className="cta-radio__punto" aria-hidden />{t}
              </button>
            ))}
          </div>
          <p>Selecciona la opción que mejor describa tu problema.</p>
        </aside>
      </div>
    </>
  );
}
