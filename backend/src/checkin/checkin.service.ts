import { Injectable, ForbiddenException } from '@nestjs/common';
import { CheckinRepository } from './checkin.repository';
import { MembershipsRepository } from '../memberships/memberships.repository';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { CheckinStatus } from '@prisma/client';
import { WsGateway } from '../common/websocket/ws.gateway'; // ✅ integración realtime

@Injectable()
export class CheckinService {
  constructor(
    private readonly repo: CheckinRepository,
    private readonly memberships: MembershipsRepository,
    private readonly ws: WsGateway, // ✅ inyectamos el gateway de websockets
  ) {}

  /**
   * Registrar check-in validando membresía activa
   * Emite evento realtime "checkin_event" al gateway
   */
  async register(dto: CreateCheckinDto) {
    const activeMembership = await this.memberships.findActiveByUserId(dto.userId);

    // 🔴 Sin membresía activa
    if (!activeMembership) {
      const denied = await this.repo.create({
        userId: dto.userId,
        membershipId: null,
        status: CheckinStatus.DENIED,
        notes: 'Sin membresía activa',
      });

      this.ws.emit('checkin_event', {
        status: 'DENIED',
        userId: dto.userId,
        membershipId: null,
        timestamp: denied.timestamp.toISOString(),
        notes: denied.notes,
      });

      throw new ForbiddenException('El usuario no tiene una membresía activa');
    }

    // 🟢 Membresía activa → crear registro permitido
    const checkin = await this.repo.create({
      userId: dto.userId,
      membershipId: activeMembership.id,
      status: CheckinStatus.ALLOWED,
      notes: dto.notes ?? null,
    });

    // Emitimos evento realtime
    this.ws.emit('checkin_event', {
      status: 'ALLOWED',
      userId: dto.userId,
      membershipId: activeMembership.id,
      timestamp: checkin.timestamp.toISOString(),
      notes: checkin.notes,
    });

    return checkin;
  }

  /**
   * Listar todos los check-ins
   */
  async findAll() {
    return this.repo.findAll();
  }

  /**
   * Buscar check-ins por usuario
   */
  async findByUser(userId: string) {
    return this.repo.findByUser(userId);
  }

  /**
   * Listar check-ins del día actual
   */
  async findToday() {
    return this.repo.findToday();
  }
}
