'use client';

import { useState } from 'react';
import { BotonActivo, EncabezadoCuenta, FilaAjuste } from '@/components/cuenta/Cuenta';
import { api } from '@/lib/api';
import { usePreferencias } from '@/lib/useCuenta';

// "Web · Privacidad": cada interruptor se guarda al momento
export default function PrivacidadPage() {
  const { prefs, cambiar, error, setError } = usePreferencias();
  const [info, setInfo] = useState('');

  async function descargar() {
    setError(''); setInfo('');
    try {
      const datos = await api<unknown>('/cuenta/datos');
      const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mis-datos-divika.json';
      a.click();
      URL.revokeObjectURL(url);
      setInfo('Descargamos tus datos en un archivo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron descargar tus datos');
    }
  }

  const fila = (clave: 'mostrarFoto' | 'compartirUbicacion' | 'personalizar', t: string, d: string) => (
    <FilaAjuste titulo={t} detalle={d}>
      <BotonActivo activo={!!prefs?.privacidad[clave]} etiqueta={t} deshabilitado={!prefs} onChange={(v) => cambiar('privacidad', clave, v)} />
    </FilaAjuste>
  );

  return (
    <>
      <EncabezadoCuenta titulo="Privacidad" sub="Tú decides qué información compartes y cómo se usan tus datos." />
      <section className="acc-tarjeta">
        <h2>Información personal</h2>
        {fila('mostrarFoto', 'Mostrar mi foto de perfil', 'Visible para los negocios con los que reservas.')}
        {fila('compartirUbicacion', 'Compartir mi ubicación', 'Encuentra servicios cerca de ti.')}
        {fila('personalizar', 'Personalizar recomendaciones', 'Según tus intereses y actividad.')}
        {error && <p className="acc-error" role="alert">{error}</p>}
      </section>
      <section className="acc-tarjeta">
        <h2>Administrar mis datos</h2>
        <div className="acc-redes">
          <button type="button" className="acc-btn-borde" onClick={descargar}>Descargar mis datos</button>
          <button type="button" className="acc-btn-borde" onClick={() => setInfo('Divika no guarda tu historial de búsqueda, así que no hay nada que borrar.')}>Borrar historial de búsqueda</button>
        </div>
        <button type="button" className="acc-enlace-boton cta-alinear" onClick={() => setInfo('La política de privacidad estará disponible pronto.')}>Política de privacidad →</button>
        {info && <p className="acc-aviso" role="status">{info}</p>}
        <p className="acc-nota">Tus datos de contacto no se muestran públicamente.</p>
      </section>
    </>
  );
}
