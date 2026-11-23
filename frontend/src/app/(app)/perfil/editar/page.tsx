'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// "Editar perfil" ahora es la pantalla Mi perfil
export default function EditarPerfilPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/perfil'); }, [router]);
  return null;
}
