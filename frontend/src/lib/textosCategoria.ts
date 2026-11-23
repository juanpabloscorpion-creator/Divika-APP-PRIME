// Textos que cambian según la categoría (diseños de listados y detalles por categoría)
export type TextosCategoria = {
  subtitulo: string; // bajo el título del listado
  reserva: string; // título de la tarjeta de reserva
  reservaTexto: string;
  boton: string; // botón para enviar la solicitud
  servicios: string; // pestaña y sección de servicios del detalle
};

const BASE: TextosCategoria = {
  subtitulo: 'Encuentra negocios locales y reserva en línea.',
  reserva: 'Reserva tu cita',
  reservaTexto: 'Elige cuándo ir. El negocio revisará tu solicitud antes de confirmar.',
  boton: 'Solicitar cita',
  servicios: 'Servicios',
};

const TEXTOS: Record<string, Partial<TextosCategoria>> = {
  restaurantes: { subtitulo: 'Descubre nuevos sabores y encuentra tu próxima mesa favorita.', reserva: 'Reserva tu mesa', reservaTexto: 'Elige cuándo venir. El restaurante revisará tu solicitud antes de confirmar.', boton: 'Solicitar mesa', servicios: 'Menú y experiencias' },
  salud: { subtitulo: 'Cuida de ti con profesionales y servicios de salud en tu comunidad.', reserva: 'Agenda tu consulta', reservaTexto: 'Selecciona el tipo de consulta y envía tu solicitud. Atención sujeta a validación del equipo.', servicios: 'Consultas y servicios' },
  hogar: { subtitulo: 'Encuentra manos expertas para cuidar, reparar y renovar tu hogar.', reserva: 'Solicita una visita', reservaTexto: 'Primero revisan tu proyecto. Después recibes una cotización, sin compromiso.', boton: 'Solicitar visita', servicios: 'Servicios' },
  cafeterias: { subtitulo: 'Café, pan y un buen lugar para hacer una pausa.', reserva: 'Programa tu pedido', reservaTexto: 'Selecciona tu antojo y la hora. La cafetería confirmará existencias.', boton: 'Solicitar pedido', servicios: 'Carta de café y pan' },
  automotriz: { subtitulo: 'Todo para cuidar tu auto, con especialistas de tu zona.', reserva: 'Agenda una revisión', reservaTexto: 'Reserva tu espacio. Las reparaciones se cotizan después de revisar tu vehículo.', boton: 'Solicitar cita en taller', servicios: 'Servicios del taller' },
  tecnologia: { subtitulo: 'Soluciones expertas para tus dispositivos y tu vida digital.', reserva: 'Agenda una revisión', reservaTexto: 'Elige el servicio y la hora. El técnico confirmará tu solicitud.', servicios: 'Servicios' },
  belleza: { subtitulo: 'Encuentra ese lugar especial para cuidarte y sentirte bien.', reserva: 'Agenda tu momento', reservaTexto: 'Elige servicio, modalidad y horario. El salón confirmará tu solicitud.', servicios: 'Servicios de belleza' },
  entretenimiento: { subtitulo: 'Haz espacio para disfrutar. Tu próximo plan está más cerca de lo que crees.', reserva: 'Reserva tu lugar', reservaTexto: 'Elige el día y la hora. El lugar confirmará tu reservación.', boton: 'Solicitar reserva', servicios: 'Experiencias' },
  mascotas: { subtitulo: 'Cuidado y cariño para tus mascotas, cerca de ti.', reserva: 'Agenda una cita', servicios: 'Servicios' },
  limpieza: { subtitulo: 'Espacios limpios sin complicarte: servicios de limpieza de confianza.', reserva: 'Solicita un servicio', boton: 'Solicitar servicio', servicios: 'Servicios' },
  estetica: { subtitulo: 'Tratamientos y cuidados para verte y sentirte bien.', reserva: 'Agenda tu cita', servicios: 'Tratamientos' },
  ropa: { subtitulo: 'Moda y estilo de tiendas locales.', reserva: 'Aparta tu visita', reservaTexto: 'Elige cuándo ir. La tienda confirmará tu visita.', boton: 'Solicitar visita', servicios: 'Productos y servicios' },
};

export const textosCategoria = (slug?: string | null): TextosCategoria => ({ ...BASE, ...(slug ? TEXTOS[slug] : {}) });
