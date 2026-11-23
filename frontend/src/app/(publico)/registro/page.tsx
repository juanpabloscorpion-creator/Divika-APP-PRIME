'use client';

import Link from 'next/link';
import { RegistroClienteForm } from '@/components/forms/RegistroClienteForm';
import { Atras } from '@/components/layout/Atras';
import { Logo } from '@/components/layout/Logo';

// Registro de clientes. Los negocios se registran en /proveedores/registro (alta completa del proveedor)
export default function RegistroPage() {
  return (
    <main className="screen screen--pagina">
      <Atras href="/" />
      <Logo pequeno />
      <div className="tabs">
        <button type="button" aria-pressed>
          Soy cliente
        </button>
        <Link href="/proveedores/registro">Tengo un negocio</Link>
      </div>
      <RegistroClienteForm />
      <p className="texto-aparte">
        ¿Ya tienes cuenta? <Link href="/acceso">Inicia sesión</Link>
      </p>
    </main>
  );
}
