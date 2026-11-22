import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { NegociosService } from './negocios.service';

// Directorio público. Para editar un negocio se usa /proveedor/negocio (con la sesión del dueño)
@Controller('negocios')
export class NegociosController {
  constructor(private service: NegociosService) {}

  // Filtros: buscar (nombre), categoria, subcategoria. orden=distancia necesita lat y lng (si no, va por calificación)
  @Get()
  listar(
    @Query('buscar') buscar?: string,
    @Query('categoria') categoria?: string,
    @Query('subcategoria') subcategoria?: string,
    @Query('orden') orden?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.service.listar({
      buscar,
      categoria,
      subcategoria,
      orden: orden === 'distancia' ? 'distancia' : 'calificacion',
      lat: lat !== undefined ? parseFloat(lat) : undefined,
      lng: lng !== undefined ? parseFloat(lng) : undefined,
    });
  }

  @Get('top')
  top() {
    return this.service.top(10);
  }

  @Get(':id')
  uno(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.uno(id);
  }

  // Visita al perfil (business_views) y clics de contacto (contact_events)
  @Post(':id/visita')
  visita(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.registrarVisita(id);
  }

  @Post(':id/clic-whatsapp')
  clicWhatsapp(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.registrarContacto(id, 'whatsapp');
  }

  @Post(':id/clic-llamada')
  clicLlamada(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.registrarContacto(id, 'llamada');
  }
}
