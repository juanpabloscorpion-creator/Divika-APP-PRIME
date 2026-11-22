import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';

// Lo que queda en req.user: sub = id (uuid) del usuario, rol = 'cliente' | 'negocio' | 'admin'
export type ReqUsuario = { user: { sub: string; rol: string } };

// Úsalo en cualquier ruta con @UseGuards(JwtAuthGuard). Deja el payload en req.user
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Falta iniciar sesión');
    try {
      req.user = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }
    // Tokens de la versión anterior (ids numéricos) ya no sirven: el front vuelve al login
    if (!isUUID(String(req.user?.sub))) throw new UnauthorizedException('Sesión inválida o vencida');
    return true;
  }
}
