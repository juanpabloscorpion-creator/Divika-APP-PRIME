'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MarcoAcceso } from '@/components/web/MarcoAcceso';
import { getToken } from '@/lib/auth';

// "Web · Registro completado"
export default function VerificadoPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace('/');
    else setListo(true);
  }, [router]);

  if (!listo) return null;

  return (
    <MarcoAcceso titulo="Tu registro está listo" sub="Ya puedes acceder a los servicios cerca de ti.">
      <section className="acc-tarjeta acc-tarjeta--centro acc-listo">
        <svg className="acc-listo__check" viewBox="0 0 24 24" width="36" height="36" aria-hidden><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <h2>Verificación completada</h2>
        <p>Tu cuenta de cliente está verificada. Guarda tus favoritos y consulta tus próximas reservaciones desde tu perfil.</p>
        <Link href="/home" className="acc-btn">Explorar servicios <span aria-hidden>→</span></Link>
        <Link href="/perfil" className="acc-enlace acc-enlace--fuerte">Ir a mi perfil</Link>
      </section>
    </MarcoAcceso>
  );
}
