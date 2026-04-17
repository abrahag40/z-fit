import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { DashboardFinanceService } from './finance/dashboard.finance.service';

/**
 * 📊 DashboardController
 * --------------------------------------------------------------------
 * Controlador maestro que consolida todas las métricas y operaciones
 * en tiempo real del gimnasio (actividad, finanzas, analítica).
 */
@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly financeService: DashboardFinanceService,
  ) {}

  // =========================================================
  // ⚙️ ESTADO DEL MÓDULO Y OPERACIONES EN TIEMPO REAL
  // =========================================================

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('ping')
  @ApiOperation({
    summary: 'Verifica la disponibilidad del módulo Dashboard',
    description: 'Devuelve un OK para confirmar que el módulo está operativo.',
  })
  ping() {
    return { ok: true, message: 'Dashboard module active' };
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('refresh')
  @ApiOperation({
    summary: 'Actualiza las métricas y transmite datos en tiempo real',
    description: 'Fuerza la recarga de métricas y su broadcast por WebSockets.',
  })
  async refresh() {
    return this.dashboardService.refreshAndBroadcast();
  }

  // =========================================================
  // 📈 MÉTRICAS PRINCIPALES
  // =========================================================

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('metrics')
  @ApiOperation({
    summary: 'Snapshot de métricas operativas',
    description:
      'Devuelve check-ins de hoy, membresías activas, expiradas y por expirar.',
  })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  // =========================================================
  // 📊 REPORTES Y TENDENCIAS
  // =========================================================

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('checkins/daily')
  @ApiOperation({
    summary: 'Tendencia diaria de check-ins (últimos 7 días)',
    description: 'Datos agrupados por día, ideal para gráficas de actividad.',
  })
  getDailyTrend() {
    return this.dashboardService.getDailyCheckinsTrend();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('checkins/peak-hour')
  @ApiOperation({
    summary: 'Horas pico de asistencia',
    description: 'Devuelve los horarios con mayor concentración de check-ins.',
  })
  getPeakHours() {
    return this.dashboardService.getPeakHours();
  }

  @Roles(Role.ADMIN)
  @Get('activity/history')
  @ApiOperation({
    summary: 'Histórico de actividad (solo ADMIN)',
    description: 'Registros de check-ins entre fechas específicas.',
  })
  @ApiQuery({
    name: 'from',
    required: true,
    description: 'Fecha inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    description: 'Fecha final (YYYY-MM-DD)',
  })
  async getActivityHistory(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboardService.getActivityHistory(from, to);
  }

  @Roles(Role.ADMIN)
  @Get('performance/global')
  @ApiOperation({
    summary: 'Indicadores globales del negocio',
    description: 'Compara actividad e ingresos respecto a la semana anterior.',
  })
  async getGlobalPerformance() {
    return this.dashboardService.getGlobalPerformance();
  }

  // =========================================================
  // 💰 MÉTRICAS FINANCIERAS (solo ADMIN)
  // =========================================================

  @Roles(Role.ADMIN)
  @Get('finance')
  @ApiOperation({
    summary: 'Dashboard financiero completo (solo ADMIN)',
    description:
      'Incluye ingresos, tendencias, métodos de pago y rendimiento por plan.',
  })
  getFinanceDashboard() {
    return this.financeService.getFullFinancialDashboard();
  }

  @Roles(Role.ADMIN)
  @Get('finance/summary')
  @ApiOperation({
    summary: 'Resumen financiero rápido',
    description: 'Totales de ingresos diarios, semanales y globales.',
  })
  getFinanceSummary() {
    return this.financeService.getSummary();
  }

  @Roles(Role.ADMIN)
  @Get('finance/methods')
  @ApiOperation({
    summary: 'Ingresos por método de pago',
    description:
      'Agrupación de ingresos por efectivo, tarjeta, transferencia, etc.',
  })
  getRevenueByMethod() {
    return this.financeService.getRevenueByMethod();
  }

  @Roles(Role.ADMIN)
  @Get('finance/plans')
  @ApiOperation({
    summary: 'Rendimiento por plan de membresía',
    description:
      'Permite comparar ingresos totales y cantidad de pagos por plan.',
  })
  getPerformanceByPlan() {
    return this.financeService.getPerformanceByPlan();
  }

  @Roles(Role.ADMIN)
  @Get('finance/trend')
  @ApiOperation({
    summary: 'Tendencia de ingresos diarios',
    description: 'Serie temporal de ingresos confirmados (últimos 14 días).',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Cantidad de días a consultar (por defecto 14)',
  })
  getRevenueTrend(@Query('days') days?: string) {
    const nDays = Number(days) || 14;
    return this.financeService.getRevenueTrend(nDays);
  }

  // =========================================================
  // ❤️ SALUD DEL SISTEMA
  // =========================================================

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('health')
  @ApiOperation({
    summary: 'Estado del módulo Dashboard',
    description: 'Confirma la disponibilidad de los servicios.',
  })
  healthCheck() {
    return { ok: true, module: 'dashboard', timestamp: new Date() };
  }
}
