import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';
import { Membership } from '@prisma/client';

@Injectable()
export class MembershipsService {
  constructor(private readonly repo: MembershipsRepository) {}

  async create(dto: CreateMembershipDto): Promise<MembershipResponseDto> {
    const membership = await this.repo.create({
      user: { connect: { id: dto.userId } },
      type: dto.type,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      price: dto.price,
      status: dto.status ?? 'ACTIVE',
    });
    return this.toResponse(membership);
  }

  async findAll(): Promise<MembershipResponseDto[]> {
    const data = await this.repo.findAll();
    return data.map(m => this.toResponse(m));
  }

  async findById(id: string, userId: string, role: string): Promise<MembershipResponseDto> {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');

    if (role === 'CLIENT' && membership.userId !== userId)
      throw new ForbiddenException('No puedes acceder a esta membresía');

    return this.toResponse(membership);
  }

  async findByUser(userId: string): Promise<MembershipResponseDto[]> {
    const data = await this.repo.findByUser(userId);
    return data.map(m => this.toResponse(m));
  }

  async update(id: string, dto: UpdateMembershipDto): Promise<MembershipResponseDto> {
    const updated = await this.repo.update(id, {
      type: dto.type,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      price: dto.price,
      status: dto.status,
    });
    return this.toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');
    await this.repo.delete(id);
  }

  private toResponse(m: Membership): MembershipResponseDto {
    return {
      id: m.id,
      userId: m.userId,
      type: m.type,
      startDate: m.startDate,
      endDate: m.endDate,
      price: m.price ?? 0,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  /**
   * Marca todas las membresías vencidas como EXPIRED.
   * Puede ejecutarse de forma manual o con un cron en el futuro.
   */
  async checkExpiredMemberships(): Promise<{ updated: number }> {
    const now = new Date();
    const updated = await this.repo.expireAllBefore(now);
    return { updated };
  }

  async previewExpiredCandidates(): Promise<any[]> {
    const now = new Date();
    return this.repo.findCandidatesToExpire(now);
  }

  /**
   * Renueva una membresía extendiendo su vigencia.
   */
  async renewMembership(id: string, extraDays: number): Promise<MembershipResponseDto> {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');

    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + extraDays);

    const updated = await this.repo.update(id, {
      status: 'ACTIVE',
      endDate: newEndDate,
    });

    return this.toResponse(updated);
  }

}
