import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import NodeCache from 'node-cache';
import { WsGateway } from 'src/common/websocket/ws.gateway';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private static readonly cache = new NodeCache({ stdTTL: 30, checkperiod: 15 });

  constructor(
    private prisma: PrismaService,
    private ws: WsGateway,
  ) {}

  /**
   * Obtiene las métricas principales del dashboard.
   * Usa cache local en memoria con TTL de 30 segundos.
   */
  async getMetrics(forceRefresh = false) {
    const cacheKey = 'dashboard_metrics';

    // 🔍 Debug 1: ¿existe el cache actual?
    const cached = DashboardService.cache.get(cacheKey);
    console.log(`🧠 Cache hit? ${!!cached}`);

    if (cached && !forceRefresh) {
      console.log('📦 Métricas servidas desde cache');
      return cached;
    }

    console.log('📊 Calculando métricas actualizadas (cache miss)...');

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [checkinsToday, activeMemberships, expiredMemberships, expiringSoon] =
      await Promise.all([
        this.prisma.checkin.count({ where: { timestamp: { gte: startOfDay } } }),
        this.prisma.membership.count({ where: { status: 'ACTIVE' } }),
        this.prisma.membership.count({ where: { status: 'EXPIRED' } }),
        this.prisma.membership.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const metrics = {
      timestamp: new Date(),
      checkins_today: checkinsToday,
      active_memberships: activeMemberships,
      expired_memberships: expiredMemberships,
      expiring_soon: expiringSoon,
    };

    // 🔍 Debug 2: Guardar y verificar cache
    DashboardService.cache.set(cacheKey, metrics);
    const verify = DashboardService.cache.get(cacheKey);
    console.log(`💾 Guardado en cache? ${!!verify}`);

    console.log('✅ Métricas actualizadas y cacheadas');
    return metrics;
  }

  /**
   * Fuerza actualización y emite evento realtime
   */
  async refreshAndBroadcast() {
    const latest = await this.getMetrics(true);
    this.ws.emitDashboardUpdate(latest);
    console.log('📢 Emitido evento dashboard_update');
    return latest;
  }

   /**
   * Retorna la cantidad de check-ins por día (últimos 7 días)
   */
  async getDailyCheckinsTrend() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const dailyData = await this.prisma.checkin.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
    });

    // Agrupamos por día normalizado (sin horas)
    const trendMap: Record<string, number> = {};
    for (const row of dailyData) {
      const day = new Date(row.timestamp).toISOString().split('T')[0];
      trendMap[day] = (trendMap[day] ?? 0) + row._count._all;
    }

    // ✅ Declaramos tipo explícito del array
    const trend: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split('T')[0];
      trend.push({ date: key, count: trendMap[key] ?? 0 });
    }

    return { trend };
  }

  /**
   * Retorna los check-ins agrupados por hora (24h)
   */
  async getPeakHours() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const checkins = await this.prisma.checkin.findMany({
      where: { timestamp: { gte: startOfDay } },
      select: { timestamp: true },
    });

    // Agrupar por hora
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts = hours.map((h) => ({ hour: h, count: 0 }));

    for (const c of checkins) {
      const hour = new Date(c.timestamp).getHours();
      counts[hour].count++;
    }

    const peakHour = counts.reduce(
      (max, curr) => (curr.count > max.count ? curr : max),
      { hour: 0, count: 0 },
    );

    return { peakHour, distribution: counts };
  }

  /**
   * Histórico de check-ins entre fechas (YYYY-MM-DD).
   * Valida formato y retorna lista normalizada.
   */
  async getActivityHistory(from: string, to: string) {
    if (!from || !to) {
      throw new BadRequestException('Parámetros "from" y "to" son requeridos (YYYY-MM-DD)');
    }
    const fromDate = this.parseYMD(from);
    const toDate = this.parseYMD(to);
    if (!fromDate || !toDate) {
      throw new BadRequestException('Formato inválido. Usa YYYY-MM-DD');
    }
    // toDate exclusivo → agregamos 1 día para incluir "to" en gte/lt
    const toExclusive = new Date(toDate);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const records = await this.prisma.checkin.findMany({
      where: {
        timestamp: {
          gte: fromDate,
          lt: toExclusive,
        },
      },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        timestamp: true,
        status: true,
        notes: true,
        user: { select: { id: true, email: true, name: true } },
        membership: {
          select: {
            id: true,
            status: true,
            endDate: true,
            plan: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      range: { from, to },
      total: records.length,
      records,
    };
  }

    /**
   * Indicadores globales con comparación semana actual vs semana pasada:
   * - check-ins (conteo)
   * - ingresos (suma)
   * - % variación por métrica
   */
    async getGlobalPerformance() {
      // Semana actual: últimos 7 días hasta ahora
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
  
      // Semana anterior: los 7 días previos a weekStart
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(weekStart); // exclusivo para query lt
  
      // Check-ins
      const [checksCurr, checksPrev] = await Promise.all([
        this.prisma.checkin.count({ where: { timestamp: { gte: weekStart } } }),
        this.prisma.checkin.count({
          where: { timestamp: { gte: prevWeekStart, lt: prevWeekEnd } },
        }),
      ]);
  
      // Ingresos (pagos PAID)
      const [revCurrAgg, revPrevAgg] = await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID', paidAt: { gte: weekStart } },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'PAID',
            paidAt: { gte: prevWeekStart, lt: prevWeekEnd },
          },
        }),
      ]);
  
      const revenueCurr = Number(revCurrAgg._sum.amount ?? 0);
      const revenuePrev = Number(revPrevAgg._sum.amount ?? 0);
  
      return {
        period: {
          current: { from: weekStart, to: now },
          previous: { from: prevWeekStart, to: prevWeekEnd },
        },
        checkins: {
          current: checksCurr,
          previous: checksPrev,
          variationPct: this.variationPct(checksPrev, checksCurr),
        },
        revenue: {
          current: revenueCurr,
          previous: revenuePrev,
          variationPct: this.variationPct(revenuePrev, revenueCurr),
          currency: 'MXN',
        },
      };
    }

  // =========================================================
  // Helpers
  // =========================================================

  /**
   * Parsea YYYY-MM-DD → Date (00:00 local). Retorna null si inválido.
   */
  private parseYMD(ymd: string): Date | null {
    // Validación simple
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    // Verifica que la fecha sea coherente
    if (isNaN(dt.getTime())) return null;
    return dt;
  }

  /**
   * Variación porcentual con protección a división entre cero.
   * Ej: prev=50, curr=75 → +50%
   */
  private variationPct(prev: number, curr: number): number {
    if (!prev && !curr) return 0;
    if (!prev && curr) return 100; // de 0 a algo → +100%
    return Number((((curr - prev) / prev) * 100).toFixed(2));
  }
}
