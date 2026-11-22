import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interesado } from '../../entidades';
import { CrearInteresadoDto } from './dto';

@Controller('proveedores')
export class ProveedoresController {
  constructor(@InjectRepository(Interesado) private readonly repo: Repository<Interesado>) {}

  // Formulario "Únete gratis" de la landing de proveedores (sin sesión) → provider_leads
  @Post('interesados')
  async crear(@Body() dto: CrearInteresadoDto) {
    await this.repo.insert({ businessName: dto.nombreNegocio.trim(), service: dto.servicio.trim(), phone: dto.telefono.trim(), city: dto.ciudad.trim() });
    return { ok: true };
  }
}
