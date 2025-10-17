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
}
