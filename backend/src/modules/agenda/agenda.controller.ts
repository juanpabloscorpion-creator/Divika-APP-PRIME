import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { exigirFoto, subidaFoto } from '../../common/almacenamiento';
import { JwtAuthGuard, ReqUsuario as Req_ } from '../../common/jwt-auth.guard';
import { AgendaService } from './agenda.service';
import { CrearCitaDto, DisponibilidadDto, MensajeDto, ProponerHorarioDto, RespuestaResenaDto, ServicioDto } from './dto';

const Id = (nombre: string) => Param(nombre, ParseUUIDPipe);

// Lo que ve cualquier visitante
@Controller('negocios')
export class AgendaPublicaController {
  constructor(private s: AgendaService) {}

  @Get(':id/servicios')
  servicios(@Id('id') id: string) {
    return this.s.serviciosPublicos(id);
  }

  @Get(':id/disponibilidad')
  disponibilidad(@Id('id') id: string, @Query('fecha') fecha: string, @Query('servicioId') servicioId?: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '')) throw new BadRequestException('Manda la fecha como AAAA-MM-DD');
    if (servicioId && !isUUID(servicioId)) throw new BadRequestException('Servicio no válido');
    return this.s.horasOcupadas(id, fecha, servicioId || undefined);
  }
}

// Lado del cliente
@UseGuards(JwtAuthGuard)
@Controller()
export class AgendaClienteController {
  constructor(private s: AgendaService) {}

  @Post('citas')
  crear(@Req() r: Req_, @Body() dto: CrearCitaDto) {
    return this.s.crearCita(r.user.sub, dto);
  }
  @Get('citas/mias')
  mias(@Req() r: Req_) {
    return this.s.citasDelCliente(r.user.sub);
  }
  @Post('citas/:id/aceptar-propuesta')
  aceptar(@Req() r: Req_, @Id('id') id: string) {
    return this.s.aceptarPropuesta(r.user.sub, id);
  }
  // Cancela el cliente o el dueño del negocio
  @Post('citas/:id/cancelar')
  cancelar(@Req() r: Req_, @Id('id') id: string) {
    return this.s.cancelar(r.user.sub, id);
  }

  @Get('mensajes')
  conversaciones(@Req() r: Req_) {
    return this.s.conversacionesCliente(r.user.sub);
  }
  @Get('mensajes/negocio/:negocioId')
  hilo(@Req() r: Req_, @Id('negocioId') id: string) {
    return this.s.hiloCliente(r.user.sub, id);
  }
  @Post('mensajes/negocio/:negocioId')
  enviar(@Req() r: Req_, @Id('negocioId') id: string, @Body() dto: MensajeDto) {
    return this.s.enviarCliente(r.user.sub, id, dto);
  }
}

// Lado del negocio (el dueño con sesión)
@UseGuards(JwtAuthGuard)
@Controller('proveedor')
export class AgendaProveedorController {
  constructor(private s: AgendaService) {}

  @Get('servicios')
  servicios(@Req() r: Req_) {
    return this.s.serviciosMios(r.user.sub);
  }
  @Post('servicios')
  crearServicio(@Req() r: Req_, @Body() dto: ServicioDto) {
    return this.s.crearServicio(r.user.sub, dto);
  }
  @Put('servicios/:id')
  editarServicio(@Req() r: Req_, @Id('id') id: string, @Body() dto: ServicioDto) {
    return this.s.actualizarServicio(r.user.sub, id, dto);
  }
  // multipart/form-data con el campo "foto" (JPG o PNG, máx. 5 MB)
  @Post('servicios/:id/foto')
  @UseInterceptors(subidaFoto())
  fotoServicio(@Req() r: Req_, @Id('id') id: string, @UploadedFile() foto?: Express.Multer.File) {
    return this.s.fotoServicio(r.user.sub, id, exigirFoto(foto));
  }
  @Delete('servicios/:id/foto')
  quitarFotoServicio(@Req() r: Req_, @Id('id') id: string) {
    return this.s.fotoServicio(r.user.sub, id, null);
  }
  @Delete('servicios/:id')
  borrarServicio(@Req() r: Req_, @Id('id') id: string) {
    return this.s.borrarServicio(r.user.sub, id);
  }

  @Get('citas')
  citas(@Req() r: Req_) {
    return this.s.citasDelNegocio(r.user.sub);
  }
  @Post('citas/:id/confirmar')
  confirmar(@Req() r: Req_, @Id('id') id: string) {
    return this.s.confirmar(r.user.sub, id);
  }
  @Post('citas/:id/rechazar')
  rechazar(@Req() r: Req_, @Id('id') id: string) {
    return this.s.rechazar(r.user.sub, id);
  }
  @Post('citas/:id/proponer')
  proponer(@Req() r: Req_, @Id('id') id: string, @Body() dto: ProponerHorarioDto) {
    return this.s.proponer(r.user.sub, id, dto);
  }

  @Get('mensajes')
  conversaciones(@Req() r: Req_) {
    return this.s.conversacionesNegocio(r.user.sub);
  }
  @Get('mensajes/:clienteId')
  hilo(@Req() r: Req_, @Id('clienteId') id: string) {
    return this.s.hiloNegocio(r.user.sub, id);
  }
  @Post('mensajes/:clienteId')
  enviar(@Req() r: Req_, @Id('clienteId') id: string, @Body() dto: MensajeDto) {
    return this.s.enviarNegocio(r.user.sub, id, dto);
  }

  @Get('disponibilidad')
  miDisponibilidad(@Req() r: Req_) {
    return this.s.disponibilidadMia(r.user.sub);
  }
  @Put('disponibilidad')
  guardarDisponibilidad(@Req() r: Req_, @Body() dto: DisponibilidadDto) {
    return this.s.guardarDisponibilidad(r.user.sub, dto);
  }

  @Get('resenas')
  resenas(@Req() r: Req_) {
    return this.s.resenasMias(r.user.sub);
  }
  @Post('resenas/:id/respuesta')
  responder(@Req() r: Req_, @Id('id') id: string, @Body() dto: RespuestaResenaDto) {
    return this.s.responderResena(r.user.sub, id, dto.texto);
  }
}
