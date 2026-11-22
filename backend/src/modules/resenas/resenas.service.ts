import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NegocioVistaService } from '../../base/negocio-vista.service';
import { NotificacionesService } from '../../base/notificaciones.service';
import { Resena, RespuestaResena } from '../../entidades';
import { resenaApi } from '../agenda/agenda.service';
import { CrearResenaDto } from './dto';

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena) private repo: Repository<Resena>,
    @InjectRepository(RespuestaResena) private respuestas: Repository<RespuestaResena>,
    private vistas: NegocioVistaService,
    private avisos: NotificacionesService,
  ) {}

  // Reseñas publicadas de un negocio, con la respuesta del negocio si la hay
  async listarPorNegocio(negocioId: string) {
    const l = await this.repo.find({ where: { businessId: negocioId, status: 'publicado' }, relations: { usuario: true }, order: { createdAt: 'DESC' } });
    const resp = l.length ? await this.respuestas.findBy({ reviewId: In(l.map((r) => r.id)) }) : [];
    return l.map((r) => resenaApi(r, resp.find((x) => x.reviewId === r.id)));
  }

  // Una reseña por persona y negocio (índice único user_id + business_id): si ya existía, se actualiza.
  // Se publica al momento porque aún no hay panel de moderación (status 'publicado').
  async crear(usuarioId: string, dto: CrearResenaDto) {
    if (!(await this.vistas.esVisible(dto.negocioId))) throw new NotFoundException('Negocio no encontrado');
    const previa = await this.repo.findOneBy({ userId: usuarioId, businessId: dto.negocioId });
    const r = await this.repo.save(
      Object.assign(previa ?? this.repo.create({ userId: usuarioId, businessId: dto.negocioId }), { rating: dto.calificacion, comment: dto.comentario?.trim() || null, status: 'publicado' as const }),
    );
    const completa = await this.repo.findOneOrFail({ where: { id: r.id }, relations: { usuario: true } });
    await this.avisos.avisarAlDueno(dto.negocioId, {
      tipo: 'resena', titulo: `${completa.usuario.nCompleto} ${previa ? 'actualizó su reseña' : 'dejó una reseña'} de ${dto.calificacion} estrellas`, detalle: completa.comment, enlace: '/portal/resenas',
    });
    return resenaApi(completa, await this.respuestas.findOneBy({ reviewId: r.id }));
  }
}
