import { Module } from '@nestjs/common';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { CheckinRepository } from './checkin.repository';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsRepository } from '../memberships/memberships.repository';
import { WsModule } from '../common/websocket/ws.module'; // ✅ Importamos el módulo WebSocket

@Module({
  imports: [
    WsModule, // 👈 Permite inyectar WsGateway dentro del servicio
  ],
  controllers: [CheckinController],
  providers: [
    CheckinService,
    CheckinRepository,
    MembershipsRepository,
    PrismaService,
  ],
  exports: [CheckinService],
})
export class CheckinModule {}
