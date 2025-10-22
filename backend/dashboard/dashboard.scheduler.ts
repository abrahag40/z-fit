import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DashboardService } from './dashboard.service';
import { WsGateway } from 'src/common/websocket/ws.gateway';

@Injectable()
export class DashboardScheduler {
  private readonly logger = new Logger(DashboardScheduler.name);

  constructor(
    private readonly dashboard: DashboardService,
    private readonly ws: WsGateway,
  ) {}

  /**
   * Cron inteligente: ejecuta cada minuto solo si hay clientes conectados
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const connectedClients = this.ws.getConnectedClientsCount?.() ?? 0;

    if (connectedClients === 0) {
      this.logger.debug('⏸️ Sin clientes conectados, no se recalcula dashboard.');
      return;
    }

    this.logger.log(`⏰ ${connectedClients} cliente(s) conectados → actualizando métricas...`);
    await this.dashboard.refreshAndBroadcast();
  }
}
