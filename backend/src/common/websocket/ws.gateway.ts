import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/realtime', // 👈 Namespace donde los clientes se conectan
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger('WebSocketsController');

  /**
   * Se ejecuta cuando el Gateway ha sido inicializado correctamente.
   */
  afterInit(server: Server) {
    this.logger.log('✅ WsGateway inicializado correctamente');
    this.logger.log('🌐 Namespace activo: /realtime');
  }

  /**
   * Detecta conexiones nuevas
   */
  handleConnection(client: Socket) {
    this.logger.log(`🟢 Cliente conectado: ${client.id}`);
    client.emit('connected', { message: 'Conexión establecida con /realtime' });
  }

  /**
   * Detecta desconexiones de clientes
   */
  handleDisconnect(client: Socket) {
    this.logger.warn(`🔴 Cliente desconectado: ${client.id}`);
  }

  /**
   * Ejemplo de handler para mensajes de prueba (ping/pong)
   */
  @SubscribeMessage('ping')
  handlePing(client: Socket, payload: any) {
    this.logger.debug(`📨 Ping recibido de ${client.id}: ${JSON.stringify(payload)}`);
    client.emit('pong', { ok: true, echo: payload });
  }

  /**
   * Método general para emitir eventos desde servicios.
   * Usado por: CheckinService, Notificaciones, Dashboard, etc.
   */
  emit(event: string, payload: any) {
    if (!this.server) {
      this.logger.error(`❌ Intento de emitir evento "${event}" antes de inicializar el servidor`);
      return;
    }

    this.logger.verbose(`📡 Emitiendo evento: ${event}`);
    this.server.emit(event, payload);
  }

  /**
   * Retorna el número actual de clientes conectados
   */
  getConnectedClientsCount(): number {
    return this.server?.sockets.sockets.size ?? 0;
  }
}
