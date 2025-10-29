import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DashboardService } from './dashboard.service';
import { WsGateway } from 'src/common/websocket/ws.gateway';

/**
 * 🕒 DashboardScheduler
 * --------------------------------------------------------------------
 * Tarea automatizada que actualiza las métricas del dashboard
 * en intervalos regulares, optimizando el consumo al ejecutarse
 * únicamente si existen clientes WebSocket conectados.
 */
@Injectable()
export class DashboardScheduler {
  private readonly logger = new Logger(DashboardScheduler.name);

  constructor(
    private readonly dashboard: DashboardService,
    private readonly ws: WsGateway,
  ) {}

  /**
   * ⏰ CRON inteligente: ejecuta cada minuto solo si hay clientes conectados.
   * Usa WsGateway para determinar la cantidad de conexiones activas
   * y evita operaciones innecesarias si no hay nadie escuchando.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      // Obtener cantidad de clientes activos del Gateway
      const connectedClients = this.ws.getConnectedClientsCount?.() ?? 0;

      // Si no hay conexiones activas, evita el cómputo y loguea en debug
      if (connectedClients === 0) {
        this.logger.debug('⏸️ Sin clientes conectados, no se recalcula dashboard.');
        return;
      }

      this.logger.log(`⏰ ${connectedClients} cliente(s) conectados → actualizando métricas...`);

      // Ejecutar actualización y broadcast en tiempo real
      await this.dashboard.refreshAndBroadcast();

      this.logger.verbose('📢 Métricas actualizadas y emitidas a clientes activos.');
    } catch (err) {
      this.logger.error('❌ Error durante actualización automática del dashboard', err);
    }
  }
}
