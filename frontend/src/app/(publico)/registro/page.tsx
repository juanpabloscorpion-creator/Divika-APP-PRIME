import Link from 'next/link';
import { RegistroClienteForm } from '@/components/forms/RegistroClienteForm';
import { MarcoAcceso } from '@/components/web/MarcoAcceso';

// "Web · Registro de clientes". Los negocios se registran en /proveedores/registro
export default function RegistroPage() {
  return (
    <MarcoAcceso titulo="Crea tu cuenta de cliente" sub="Regístrate para guardar favoritos y organizar tus reservaciones.">
      <div className="acc-dos acc-dos--form">
        <section className="acc-tarjeta">
          <RegistroClienteForm />
        </section>
        <aside className="acc-panel acc-panel--lista">
          <h2>Una cuenta, todo más cerca.</h2>
          <ol>
            <li><span>01</span> Guarda tus lugares favoritos</li>
            <li><span>02</span> Consulta tus citas y reservaciones</li>
            <li><span>03</span> Administra tus preferencias</li>
          </ol>
          <Link href="/login" className="acc-enlace acc-enlace--fuerte">¿Ya tienes cuenta? Iniciar sesión</Link>
        </aside>
      </div>
    </MarcoAcceso>
  );
}
