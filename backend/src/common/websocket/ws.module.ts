import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';

/**
 * Módulo encargado de exponer el WebSocket Gateway
 * para ser usado por otros módulos (Checkin, Notificaciones, Dashboard, etc.)
 */
@Module({
  providers: [WsGateway],
  exports: [WsGateway], // 👈 Permite inyectar el Gateway en otros módulos
})
export class WsModule {}
