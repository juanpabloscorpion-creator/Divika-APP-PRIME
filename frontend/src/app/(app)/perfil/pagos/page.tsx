import { EncabezadoCuenta } from '@/components/cuenta/Cuenta';

// "Web · Formas de pago personales". Divika NO guarda tarjetas ni cobra: el pago se acuerda con cada negocio.
// Por eso aquí no hay tarjetas ni formulario para capturarlas; solo se explica cómo se paga.
const METODOS = [
  ['Efectivo', 'Pagas en el negocio o al terminar el servicio.'],
  ['Transferencia', 'El negocio te comparte sus datos para transferir.'],
  ['Tarjeta', 'Si el negocio la acepta, pagas en su terminal.'],
] as const;

export default function FormasDePagoPage() {
  return (
    <>
      <EncabezadoCuenta titulo="Formas de pago" sub="Cómo pagas tus servicios en Divika." />
      <section className="acc-tarjeta">
        <h2>Pagas directamente al negocio</h2>
        <p className="acc-texto">Divika te conecta con negocios locales, pero no hace cobros ni guarda tarjetas. Cada negocio muestra en su perfil las formas de pago que acepta, y al reservar puedes indicarle cómo piensas pagar.</p>
        <div className="cta-metodos">
          {METODOS.map(([t, d]) => (
            <div key={t} className="cta-metodo"><strong>{t}</strong><small>{d}</small></div>
          ))}
        </div>
      </section>
      <section className="acc-panel">
        <h2 className="cta-h2-panel">Cuida tus datos</h2>
        <p>Si un negocio te pide transferir, confirma sus datos en su perfil de Divika o directamente con él.</p>
        <p className="acc-error">Nunca compartas los datos completos de tu tarjeta ni códigos de seguridad por mensaje.</p>
      </section>
    </>
  );
}
