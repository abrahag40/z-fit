import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DashboardService } from './dashboard.service';

@Injectable()
export class DashboardScheduler {
  private readonly logger = new Logger(DashboardScheduler.name);

  constructor(private readonly dashboard: DashboardService) {}

  /**
   * Cron job: ejecuta cada 60 segundos
   * Recalcula métricas y las emite vía WebSocket
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('⏰ Ejecutando actualización automática del dashboard...');
    await this.dashboard.refreshAndBroadcast();
  }
}
