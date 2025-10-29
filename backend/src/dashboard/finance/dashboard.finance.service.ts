import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 💰 DashboardFinanceService
 * --------------------------------------------------------------
 * Servicio especializado en análisis financiero y rentabilidad.
 * Provee estadísticas agregadas de ingresos, métodos de pago,
 * y rendimiento por tipo de membresía o plan.
 */
@Injectable()
export class DashboardFinanceService {
  private readonly logger = new Logger(DashboardFinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 💵 1️⃣ Resumen financiero general
   * Total de ingresos, pagos del día, y crecimiento semanal.
   */
  async getSummary() {
    this.logger.log('📊 Calculando resumen financiero global...');

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Pagos totales históricos
    const totalRevenue = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    });

    // Pagos del día
    const dailyRevenue = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        paidAt: { gte: startOfDay },
      },
    });

    // Pagos de los últimos 7 días
    const weeklyRevenue = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        paidAt: { gte: sevenDaysAgo },
      },
    });

    const result = {
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      dailyRevenue: Number(dailyRevenue._sum.amount ?? 0),
      weeklyRevenue: Number(weeklyRevenue._sum.amount ?? 0),
      currency: 'MXN',
    };

    this.logger.debug(`✅ Resumen financiero: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * 📈 2️⃣ Tendencia diaria de ingresos (últimos 14 días)
   * Devuelve un arreglo con { date, total } para gráficas de línea.
   */
  async getRevenueTrend(days = 14) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: startDate },
      },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Acumulador diario
    const trendMap: Record<string, number> = {};
    for (const p of payments) {
      if (!p.paidAt) continue; // Previene errores con valores nulos
      const key = p.paidAt.toISOString().split('T')[0];
      trendMap[key] = (trendMap[key] ?? 0) + Number(p.amount);
    }

    const trend: { date: string; total: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split('T')[0];
      trend.push({ date: key, total: trendMap[key] ?? 0 });
    }

    this.logger.debug(`📆 Tendencia ${days} días: ${trend.length} puntos`);
    return trend;
  }

  /**
   * 💳 3️⃣ Análisis por método de pago
   * Calcula ingresos totales agrupados por método (CASH, CARD, etc.)
   */
  async getRevenueByMethod() {
    const result = await this.prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      where: { status: 'PAID' },
    });

    const methods = result.map((r) => ({
      method: r.method,
      total: Number(r._sum.amount ?? 0),
    }));

    this.logger.debug(`💳 Ingresos por método: ${JSON.stringify(methods)}`);
    return methods;
  }

  /**
   * 🧠 4️⃣ Rendimiento por tipo de plan
   * Combina los ingresos de pagos con la información de `MembershipPlan`
   */
  async getPerformanceByPlan() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'PAID' },
      select: {
        amount: true,
        membership: {
          select: {
            plan: { select: { id: true, name: true } },
          },
        },
      },
    });

    const performanceMap: Record<string, number> = {};

    for (const p of payments) {
      const planName = p.membership?.plan?.name ?? 'Sin plan';
      performanceMap[planName] = (performanceMap[planName] ?? 0) + Number(p.amount);
    }

    const performance = Object.entries(performanceMap).map(([plan, total]) => ({
      plan,
      total,
    }));

    this.logger.debug(`📊 Rendimiento por plan: ${JSON.stringify(performance)}`);
    return performance;
  }

  /**
   * 🧾 5️⃣ Resumen maestro combinado
   * Agrupa todas las métricas en un solo objeto para el dashboard.
   */
  async getFullFinancialDashboard() {
    const [summary, trend, byMethod, byPlan] = await Promise.all([
      this.getSummary(),
      this.getRevenueTrend(14),
      this.getRevenueByMethod(),
      this.getPerformanceByPlan(),
    ]);

    const dashboard = { summary, trend, byMethod, byPlan };
    this.logger.log('📈 Dashboard financiero generado');
    return dashboard;
  }
}
