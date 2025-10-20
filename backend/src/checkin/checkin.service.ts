import { Injectable, ForbiddenException } from '@nestjs/common';
import { MembershipsRepository } from '../memberships/memberships.repository';
import { CheckinRepository } from './checkin.repository';
import { CheckinStatus } from '@prisma/client';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { CheckinResponseDto } from './dto/checkin-response.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WsGateway } from 'src/common/websocket/ws.gateway';

@Injectable()
export class CheckinService {
  constructor(
    private memberships: MembershipsRepository,
    private repo: CheckinRepository,
    private ws: WsGateway,
    @InjectPinoLogger(CheckinService.name) private readonly logger: PinoLogger,
  ) {}

  async registerCheckin(dto: CreateCheckinDto): Promise<CheckinResponseDto> {
    this.logger.info(`Intento de acceso: user=${dto.userId}`);

    // Buscar membresia activa
    const activeMembership = await this.memberships.findActiveByUserId(dto.userId);

    // Si no hay membresía activa → acceso denegado
    if (!activeMembership) {
      await this.repo.create({
        userId: dto.userId,
        status: CheckinStatus.DENIED,
        notes: 'Sin membresía activa',
      });

      this.logger.warn(`Acceso denegado → user=${dto.userId} sin membresía activa`);
      this.ws.emitEvent('checkin_event', {
        userId: dto.userId,
        membershipId: null,
        status: 'DENIED',
        timestamp: new Date(),
      });

      throw new ForbiddenException('Acceso denegado: membresía inactiva o vencida.');
    }

    // Si hay membresía activa → permitir acceso
    const checkin = await this.repo.create({
      userId: dto.userId,
      membershipId: activeMembership.id,
      status: CheckinStatus.ALLOWED,
      notes: dto.notes,
    });

    this.logger.info(`Acceso permitido → user=${dto.userId}, membership=${activeMembership.id}`);
    this.ws.emitEvent('checkin_event', {
      userId: dto.userId,
      membershipId: activeMembership.id,
      status: 'ALLOWED',
      timestamp: new Date(),
    });

    return checkin;
  }

  findAll() {
    return this.repo.findAll();
  }

  findByUser(userId: string) {
    return this.repo.findByUser(userId);
  }

  findToday() {
    return this.repo.findToday();
  }
}
