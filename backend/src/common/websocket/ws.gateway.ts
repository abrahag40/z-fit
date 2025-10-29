import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class WsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WsGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    this.logger.log('⚙️ WsGateway inicializado correctamente');
    try {
      const namespaces = [...(server as any)._nsps?.keys?.() ?? []];
      this.logger.debug(`🧠 Namespaces activos: ${namespaces.join(', ') || '/'}`);
    } catch {
      this.logger.warn('No se pudieron obtener los namespaces activos');
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`🟢 Cliente conectado: ${client.id}`);
    client.emit('connected', { message: 'Conectado al canal realtime ✅' });
  }

  handleDisconnect(client: Socket) {
    this.logger.warn(`🔴 Cliente desconectado: ${client.id}`);
  }

  // === Emisiones de eventos globales ===
  emitDashboardUpdate(payload: any) {
    this.logger.debug('📡 Emitiendo dashboard_update');
    this.server.emit('dashboard_update', payload);
  }

  emitFinanceUpdate(payload: any) {
    this.logger.debug('💸 Emitiendo finance_update');
    this.server.emit('finance_update', payload);
  }

  emitCheckinEvent(data: any) {
    this.logger.debug('🏋️‍♀️ Nuevo check-in detectado');
    this.server.emit('checkin_event', data);
  }

    /**
   * Devuelve el número de clientes conectados al Socket.IO
   */
    getConnectedClientsCount(): number {
      // .sockets.sockets es un Map con todas las conexiones activas
      return this.server?.sockets?.sockets?.size ?? 0;
    }
}
