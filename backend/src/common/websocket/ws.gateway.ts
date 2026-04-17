import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { AuthenticatedUser, JwtPayload } from 'src/auth/types/jwt-payload';

/**
 * WsGateway
 * ------------------------------------------------------------------
 * Cambios clave respecto a la versión anterior:
 *
 * 1) Middleware JWT obligatorio (io.use):
 *    - Rechaza handshakes sin token o con token inválido/expirado.
 *    - Popula `socket.data.user` con la identidad autenticada.
 *
 * 2) Rooms:
 *    - Todos los sockets se unen a `user:<id>` (para emisiones
 *      dirigidas a un usuario concreto).
 *    - Los STAFF/ADMIN se unen además a `staff` (para dashboards
 *      operativos) y `finance` sólo ADMIN.
 *    - Esto elimina los broadcast globales que filtraban KPIs de
 *      negocio y métricas financieras a clientes no autorizados.
 *
 * 3) CORS se gestiona en DebugSocketIoAdapter — aquí no se fija
 *    para evitar dos fuentes de verdad.
 */
@Injectable()
@WebSocketGateway()
export class WsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('⚙️ WsGateway inicializado');

    /**
     * Middleware que se ejecuta antes de `connection`. Valida el JWT
     * proveniente de:
     *   - handshake.auth.token (preferido, socket.io-client v4)
     *   - handshake.query.token (fallback)
     *   - handshake.headers.authorization (Bearer ...)
     */
    server.use((socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) return next(new Error('UNAUTHORIZED: missing token'));

        const secret = this.cfg.get<string>('JWT_SECRET');
        const payload = this.jwt.verify<JwtPayload>(token, { secret });

        const user: AuthenticatedUser = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        };
        (socket.data as { user: AuthenticatedUser }).user = user;
        return next();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'invalid token';
        this.logger.warn(`🔒 WS auth rechazada: ${msg}`);
        return next(new Error(`UNAUTHORIZED: ${msg}`));
      }
    });
  }

  async handleConnection(client: Socket) {
    const user = (client.data as { user?: AuthenticatedUser }).user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    // Room por usuario → emisiones dirigidas (notificaciones personales).
    await client.join(`user:${user.userId}`);

    // Rooms por privilegio → dashboards operativos y financieros.
    if (user.role === Role.ADMIN || user.role === Role.STAFF) {
      await client.join('staff');
    }
    if (user.role === Role.ADMIN) {
      await client.join('finance');
    }

    this.logger.log(
      `🟢 WS connect: ${client.id} (user=${user.userId}, role=${user.role})`,
    );
    client.emit('connected', { message: 'Conectado al canal realtime ✅' });
  }

  handleDisconnect(client: Socket) {
    const user = (client.data as { user?: AuthenticatedUser }).user;
    this.logger.warn(
      `🔴 WS disconnect: ${client.id}${user ? ` (user=${user.userId})` : ''}`,
    );
  }

  // ============================================================
  //  Emisiones — todas dirigidas a rooms, nunca `server.emit`.
  // ============================================================

  /** Dashboard operativo: sólo staff/admin. */
  emitDashboardUpdate(payload: unknown) {
    this.server.to('staff').emit('dashboard_update', payload);
  }

  /** Métricas financieras: sólo admin. */
  emitFinanceUpdate(payload: unknown) {
    this.server.to('finance').emit('finance_update', payload);
  }

  /** Check-ins: se emiten a staff (operaciones) y al propio usuario. */
  emitCheckinEvent(data: { userId?: string } & Record<string, unknown>) {
    this.server.to('staff').emit('checkin_event', data);
    if (data.userId) {
      this.server.to(`user:${data.userId}`).emit('checkin_event', data);
    }
  }

  /** Conteo de conexiones activas (para el scheduler del dashboard). */
  getConnectedClientsCount(): number {
    return this.server?.sockets?.sockets?.size ?? 0;
  }

  // ============================================================
  //  Helpers privados
  // ============================================================

  private extractToken(socket: Socket): string | null {
    const auth = socket.handshake.auth as Record<string, unknown> | undefined;
    const authToken = typeof auth?.token === 'string' ? auth.token : null;
    if (authToken) return this.stripBearer(authToken);

    const query = socket.handshake.query as Record<string, unknown>;
    const queryToken = typeof query?.token === 'string' ? query.token : null;
    if (queryToken) return this.stripBearer(queryToken);

    const header = socket.handshake.headers?.authorization;
    if (typeof header === 'string' && header.length > 0) {
      return this.stripBearer(header);
    }
    return null;
  }

  private stripBearer(token: string): string {
    return token.startsWith('Bearer ') ? token.slice(7) : token;
  }
}
