import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: any) {
    console.log('🟢 Cliente conectado:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('🔴 Cliente desconectado:', client.id);
  }

  emitEvent(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
