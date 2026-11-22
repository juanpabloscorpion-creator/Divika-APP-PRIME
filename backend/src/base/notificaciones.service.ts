import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Negocio, Notificacion, TipoNotificacion } from '../entidades';

type Aviso = { tipo: TipoNotificacion; titulo: string; detalle?: string | null; enlace?: string };

// Avisos dentro de la web (tabla notifications)
@Injectable()
export class NotificacionesService {
  private log = new Logger('Notificaciones');
  constructor(
    @InjectRepository(Notificacion) private repo: Repository<Notificacion>,
    @InjectRepository(Negocio) private negocios: Repository<Negocio>,
  ) {}

  // Nunca debe romper la acción que la origina
  async avisar(userId: string, a: Aviso) {
    try {
      await this.repo.insert({ userId, type: a.tipo, title: a.titulo.slice(0, 160), detail: a.detalle?.slice(0, 160) ?? null, link: a.enlace ?? null });
    } catch (e) {
      this.log.warn(`No se pudo guardar el aviso: ${(e as Error).message}`);
    }
  }

  async avisarAlDueno(businessId: string, a: Aviso) {
    const n = await this.negocios.findOne({ where: { id: businessId }, select: { id: true, ownerId: true } });
    if (n?.ownerId) await this.avisar(n.ownerId, a);
  }

  async listar(userId: string) {
    const items = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
    return {
      noLeidas: items.filter((i) => !i.readAt).length,
      items: items.map((i) => ({ id: i.id, tipo: i.type, titulo: i.title, detalle: i.detail, enlace: i.link, leida: !!i.readAt, creadoEn: i.createdAt })),
    };
  }

  async leer(userId: string, id: string) {
    const r = await this.repo.update({ id, userId }, { readAt: new Date() });
    if (!r.affected) throw new NotFoundException('Aviso no encontrado');
    return { ok: true };
  }

  async leerTodas(userId: string) {
    await this.repo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { ok: true };
  }
}
