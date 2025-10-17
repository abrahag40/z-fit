// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async pingDb() {
    const count = await this.prisma.user.count();
    return {
      ok: true,
      ts: new Date().toISOString(),
      userCount: count,
    };
  }
}
