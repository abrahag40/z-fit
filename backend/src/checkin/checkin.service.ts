import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WsGateway } from 'src/common/websocket/ws.gateway';
import { CheckinStatus, MembershipStatus } from '@prisma/client';

/**
 * 🏋️ CheckinService
 * ----------------------------------------------------------------
 * Gestiona los registros de entrada/salida de usuarios.
 * Antes de registrar un check-in:
 *  - Verifica que exista el usuario.
 *  - Valida que tenga una membresía activa (status = ACTIVE y endDate > now).
 *  - Si no tiene membresía activa, crea un registro DENIED.
 */
@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ws: WsGateway,
  ) {}

  /**
   * Registra un check-in con validación de membresía.
   */
  async create(data: { userId: string; notes?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const activeMembership = user.memberships[0];
    const now = new Date();

    // 🔴 Sin membresía activa o vencida
    if (
      !activeMembership ||
      activeMembership.endDate.getTime() < now.getTime()
    ) {
      const denied = await this.prisma.checkin.create({
        data: {
          userId: user.id,
          membershipId: null,
          status: CheckinStatus.DENIED,
          notes: 'Sin membresía activa o vencida',
        },
      });

      this.ws.emitCheckinEvent(denied);
      this.ws.emitDashboardUpdate({
        type: 'checkin',
        data: denied,
      });

      this.logger.warn(
        `🚫 Check-in denegado para usuario ${user.email} (${user.id}) — sin membresía activa`,
      );

      throw new ForbiddenException(
        'El usuario no tiene una membresía activa o está vencida',
      );
    }

    // ✅ Membresía válida → registrar check-in normal
    const checkin = await this.prisma.checkin.create({
      data: {
        userId: user.id,
        membershipId: activeMembership.id,
        status: CheckinStatus.ALLOWED,
        notes: data.notes ?? null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        membership: { select: { id: true, status: true, endDate: true } },
      },
    });

    this.logger.log(
      `✅ Check-in permitido para ${user.email} — membresía ${activeMembership.id}`,
    );

    // 🔔 Emitir actualización en tiempo real
    this.ws.emitCheckinEvent(checkin);
    this.ws.emitDashboardUpdate({
      type: 'checkin',
      data: checkin,
    });

    return checkin;
  }

  /**
   * Alias legado para compatibilidad con controladores antiguos.
   */
  async register(dto: { userId: string; notes?: string }) {
    return this.create(dto);
  }

  /**
   * Retorna todos los check-ins recientes (máx. 100)
   */
  async findAll() {
    return this.prisma.checkin.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        membership: { select: { id: true, status: true, endDate: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
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

  /**
   * Retorna los últimos check-ins de un usuario.
   */
  async findByUser(userId: string) {
    return this.prisma.checkin.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }
}
