import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WsGateway } from 'src/common/websocket/ws.gateway';
import { CheckinStatus } from '@prisma/client';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: WsGateway, // 👈 inyectamos el gateway
  ) {}

  async create(data: { userId: string; membershipId?: string; notes?: string }) {
    const checkin = await this.prisma.checkin.create({
      data: {
        userId: data.userId,
        membershipId: data.membershipId,
        status: CheckinStatus.ALLOWED,
        notes: data.notes ?? null,
      },
    });

    this.logger.log(`✅ Check-in registrado para usuario ${data.userId}`);

    // 🔔 Emitir actualización en tiempo real
    this.ws.emitCheckinEvent(checkin);
    this.ws.emitDashboardUpdate({ type: 'checkin', data: checkin });

    return checkin;
  }

  async findAll() {
    return this.prisma.checkin.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        membership: {
          select: { id: true, status: true, endDate: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.checkin.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

    /**
   * Alias legado para compatibilidad con controladores antiguos
   */
    async register(dto: { userId: string; membershipId?: string; notes?: string }) {
      return this.create(dto);
    }
  
    /**
     * Retorna check-ins del día (00:00 → ahora)
     */
    async findToday() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
  
      return this.prisma.checkin.findMany({
        where: { timestamp: { gte: start } },
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
          membership: { select: { id: true, status: true, endDate: true } },
        },
      });
    }
}
