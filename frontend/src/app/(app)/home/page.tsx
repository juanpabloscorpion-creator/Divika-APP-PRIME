'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LandingContenido } from '@/components/web/LandingWeb';
import { ListadoWeb } from '@/components/web/ListadoWeb';

// /home                  → inicio
// /home?buscar=&ciudad=  → resultados de búsqueda
// /home?todos=1          → todos los servicios ("Explorar todos")
function Contenido() {
  const p = useSearchParams();
  const consulta = p.get('buscar') ?? '';
  const ciudad = p.get('ciudad') ?? '';
  return consulta || ciudad || p.has('todos') ? <ListadoWeb key={`${consulta}|${ciudad}`} consulta={consulta} ciudad={ciudad} /> : <LandingContenido />;
}

export default function HomePage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}
