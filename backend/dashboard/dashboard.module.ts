import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WsModule } from 'src/common/websocket/ws.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DashboardScheduler } from './dashboard.scheduler';

@Module({
  imports: [PrismaModule, WsModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardScheduler],
  exports: [DashboardService],
})
export class DashboardModule {}
