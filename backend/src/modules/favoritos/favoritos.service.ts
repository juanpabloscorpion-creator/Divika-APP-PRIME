import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NegocioVistaService } from '../../base/negocio-vista.service';
import { Favorito } from '../../entidades';

@Injectable()
export class FavoritosService {
  constructor(
    @InjectRepository(Favorito) private repo: Repository<Favorito>,
    private vistas: NegocioVistaService,
  ) {}

  // Negocios favoritos del usuario, el más reciente primero (sin los que se borraron)
  async listar(usuarioId: string) {
    const favoritos = await this.repo.find({ where: { userId: usuarioId }, relations: { negocio: true }, order: { createdAt: 'DESC' } });
    return this.vistas.vistas(favoritos.map((f) => f.negocio).filter((n) => !n.deletedAt));
  }

  // Idempotente: marcar dos veces el mismo negocio no falla ni duplica
  async agregar(usuarioId: string, negocioId: string) {
    await this.vistas.existente(negocioId);
    await this.repo.createQueryBuilder().insert().values({ userId: usuarioId, businessId: negocioId }).orIgnore().execute();
    return { favorito: true };
  }

  async quitar(usuarioId: string, negocioId: string) {
    await this.repo.delete({ userId: usuarioId, businessId: negocioId });
    return { favorito: false };
  }
}
