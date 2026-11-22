// Todas las tablas. Las del diagrama de base de datos (docs/divika.dbml) llevan su nombre exacto;
// las extra (para funciones que el diagrama no cubre) están marcadas en cada archivo.
import { Auditoria, EventoContacto, Favorito, Resena, RespuestaResena, VisitaNegocio } from './actividad';
import { Cita, Interesado, Mensaje, Notificacion, ReporteProblema, Servicio } from './agenda';
import { Categoria, DetalleNegocio, DireccionNegocio, FotoNegocio, HorarioNegocio, Negocio, NegocioCategoria } from './negocios';
import { Autenticacion, DeviceToken, OtpCode, RefreshToken, UserProfile, Usuario } from './usuarios';
import { DocumentoVerificacion, ReclamoNegocio, SolicitudVerificacion } from './verificacion';

export * from './actividad';
export * from './agenda';
export * from './negocios';
export * from './usuarios';
export * from './verificacion';

export const ENTIDADES = [
  Usuario, Autenticacion, OtpCode, RefreshToken, DeviceToken, UserProfile,
  Categoria, Negocio, DireccionNegocio, NegocioCategoria, HorarioNegocio, FotoNegocio, DetalleNegocio,
  SolicitudVerificacion, DocumentoVerificacion, ReclamoNegocio,
  Favorito, Resena, RespuestaResena, EventoContacto, Auditoria, VisitaNegocio,
  Servicio, Cita, Mensaje, Notificacion, ReporteProblema, Interesado,
];
