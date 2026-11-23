'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';

const PREGUNTAS = [
  { p: '¿Cómo cambio una reserva?', r: 'Ve a Mis reservas y escríbele al negocio, o cancela tu cita y agenda otra fecha. Si el negocio te propone otro horario, podrás aceptarlo ahí mismo.' },
  { p: '¿Cómo solicito un reembolso?', r: 'Divika no procesa pagos: el cobro se acuerda directamente con el negocio, así que cualquier reembolso se pide a él.' },
  { p: 'No puedo acceder a mi cuenta', r: 'En la pantalla de acceso elige "Código por SMS / correo" para entrar sin contraseña, o usa "Olvidé mi contraseña" para crear una nueva.' },
  { p: '¿Cómo cambio mi número de teléfono?', r: 'En Mi perfil escribe el nuevo número y guarda; te enviaremos un código para confirmarlo.' },
  { p: '¿Cómo elimino mi cuenta?', r: 'En Eliminar cuenta. Es permanente y no se puede deshacer.' },
];
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// "Web · Ayuda"
export default function AyudaPage() {
  const [q, setQ] = useState('');
  const [abierta, setAbierta] = useState<string | null>(PREGUNTAS[0].p);
  const [aviso, setAviso] = useState('');
  const lista = PREGUNTAS.filter((x) => norm(x.p + x.r).includes(norm(q)));

  return (
    <>
      <EncabezadoCuenta titulo="Soporte y ayuda" sub="Encuentra respuestas o cuéntanos qué necesitas resolver." />
      <section className="acc-tarjeta">
        <label className="acc-campo">¿Cómo podemos ayudarte?<input type="search" placeholder="Busca una pregunta o un tema" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <h2 className="cta-h2-sec">Preguntas frecuentes</h2>
        {lista.length === 0 && <p className="acc-texto">No encontramos resultados. Prueba con otras palabras o repórtanos tu problema.</p>}
        <div className="cta-faq">
          {lista.map((x) => (
            <div key={x.p} className="cta-faq__item">
              <button type="button" aria-expanded={abierta === x.p} onClick={() => setAbierta(abierta === x.p ? null : x.p)}>
                <span>{x.p}</span><span aria-hidden>{abierta === x.p ? '−' : '+'}</span>
              </button>
              {abierta === x.p && <p>{x.r}</p>}
            </div>
          ))}
        </div>
      </section>
      <section className="acc-panel">
        <h2 className="cta-h2-panel">Estamos para ayudarte</h2>
        <p>Atención de lunes a domingo · 9:00 a 21:00</p>
        <div className="cta-tres">
          <button type="button" className="acc-btn-borde" onClick={() => setAviso('El centro de ayuda estará disponible pronto. Mientras, usa las preguntas frecuentes o repórtanos tu problema.')}>Centro de ayuda</button>
          <Link href="/perfil/reportar" className="acc-btn">Contactar con soporte</Link>
          <Link href="/perfil/reportar" className="acc-btn-borde">Reportar problema</Link>
        </div>
        {aviso && <p className="acc-aviso" role="status">{aviso}</p>}
      </section>
    </>
  );
}
