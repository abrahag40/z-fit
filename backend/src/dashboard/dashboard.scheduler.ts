import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DashboardService } from './dashboard.service';
import { WsGateway } from 'src/common/websocket/ws.gateway';

/**
 * 🕒 DashboardScheduler
 * --------------------------------------------------------------------
 * Actualiza métricas del dashboard en intervalos regulares:
 *  - Cada minuto si hay clientes conectados.
 *  - Cada 10 minutos como fallback (aunque no haya sockets activos).
 *  - Ejecuta una actualización inicial tras el arranque del servidor.
 */
@Injectable()
export class DashboardScheduler {
  private readonly logger = new Logger(DashboardScheduler.name);
  private lastFallbackRun = 0; // timestamp del último fallback

  constructor(
    private readonly dashboard: DashboardService,
    private readonly ws: WsGateway,
  ) {
    // Forzamos un refresco inicial al levantar el servidor
    setTimeout(async () => {
      this.logger.log('🚀 Refrescando métricas iniciales tras arranque del servidor...');
      try {
        await this.dashboard.refreshAndBroadcast();
        this.lastFallbackRun = Date.now();
        this.logger.log('✅ Métricas iniciales actualizadas correctamente');
      } catch (err) {
        this.logger.error('❌ Error en refresco inicial de métricas', err);
      }
    }, 10_000); // espera 10 segundos post-arranque
  }

  /**
   * 🧠 Cron inteligente:
   * - Se ejecuta cada minuto.
   * - Si hay clientes → actualiza normal.
   * - Si no hay clientes → actualiza cada 10 min (modo fallback).
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      const connectedClients = this.safeClientCount();

      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      const timeSinceLastFallback = now - this.lastFallbackRun;

      if (connectedClients === 0) {
        if (timeSinceLastFallback >= tenMinutes) {
          // Ejecuta modo fallback cada 10 min
          this.logger.warn('🕐 Sin clientes activos → ejecutando fallback de métricas.');
          await this.dashboard.refreshAndBroadcast();
          this.lastFallbackRun = now;
        } else {
          this.logger.debug(
            `⏸️ Sin clientes conectados (último fallback hace ${Math.round(
              timeSinceLastFallback / 1000,
            )}s).`,
          );
        }
        return;
      }

      // ✅ Modo normal
      this.logger.log(`⏰ ${connectedClients} cliente(s) conectados → actualizando métricas...`);
      await this.dashboard.refreshAndBroadcast();
      this.logger.verbose('📢 Métricas actualizadas y emitidas en tiempo real.');
    } catch (err) {
      this.logger.error('❌ Error durante actualización automática del dashboard', err);
    }
  }

  /**
   * Devuelve el número de clientes conectados,
   * o 0 si el gateway no ha inicializado el server todavía.
   */
  private safeClientCount(): number {
    try {
      const count = this.ws.getConnectedClientsCount?.() ?? 0;
      if (isNaN(count)) return 0;
      return count;
    } catch (e) {
      this.logger.warn('⚠️ Gateway aún no inicializado, usando count=0 (modo seguro)');
      return 0;
    }
  }
}
