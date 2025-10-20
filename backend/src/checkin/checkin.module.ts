import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { CheckinRepository } from './checkin.repository';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipsRepository } from '../memberships/memberships.repository';
import { WsModule } from '../common/websocket/ws.module';

@Module({
  imports: [WsModule],
  controllers: [CheckinController],
  providers: [
    CheckinService,
    CheckinRepository,      // ✅ agregado
    MembershipsRepository,  // ya lo tenías, bien
    PrismaService,
  ],
})
export class CheckinModule {}
