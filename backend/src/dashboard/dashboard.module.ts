import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WsModule } from 'src/common/websocket/ws.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardFinanceService } from './finance/dashboard.finance.service';
import { DashboardScheduler } from './dashboard.scheduler';

/**
 * 🧠 DashboardModule
 * --------------------------------------------------------------------
 * Módulo central del sistema de analítica y control del gimnasio.
 * Integra:
 *  - Métricas operativas (DashboardService)
 *  - Métricas financieras (DashboardFinanceService)
 *  - Emisión en tiempo real vía WebSocket (WsModule)
 *  - Tareas automáticas de refresco (DashboardScheduler)
 */
@Module({
  imports: [
    PrismaModule, // acceso a BD
    WsModule, // integración realtime
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardFinanceService, DashboardScheduler],
  exports: [DashboardService, DashboardFinanceService],
})
export class DashboardModule {}
