import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('ping')
  ping() {
    return { ok: true, message: 'Dashboard module active' };
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('metrics')
  getMetrics() {
    return this.service.getMetrics();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('refresh')
  refresh() {
    return this.service.refreshAndBroadcast();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('checkins/daily')
  getDailyTrend() {
    return this.service.getDailyCheckinsTrend();
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('checkins/peak-hour')
  getPeakHours() {
    return this.service.getPeakHours();
  }
}
