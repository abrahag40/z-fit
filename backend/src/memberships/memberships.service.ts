import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';
import { MembershipStatus, Role } from '@prisma/client';

/**
 * 💼 MembershipsService (Fusionado)
 * ------------------------------------------------------------------
 * - Mantiene arquitectura limpia basada en repositorio (DDD)
 * - Integra la lógica real de negocio (planes, renovación, currency, priceSnapshot)
 * - Incluye control de acceso por roles
 * - Compatible con Dashboard financiero y Check-ins
 */
@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(private readonly repo: MembershipsRepository) {}

  // =========================================================
  // 🔹 CREACIÓN DE MEMBRESÍA
  // =========================================================
  async create(dto: CreateMembershipDto): Promise<MembershipResponseDto> {
    const plan = await this.repo.findPlanById(dto.planId);
    if (!plan) throw new NotFoundException('Plan de membresía no encontrado');

    const startDate =
      typeof dto.startDate === 'string'
        ? new Date(dto.startDate)
        : (dto.startDate ?? new Date());

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const membership = await this.repo.create({
      userId: dto.userId,
      status: MembershipStatus.ACTIVE,
      startDate,
      endDate,
      planId: plan.id,
      priceSnapshot: plan.price,
      currency: plan.currency ?? 'MXN',
    });

    this.logger.log(`✅ Membresía creada: ${membership.id} (${plan.name})`);
    return this.toResponse(membership);
  }

  // =========================================================
  // 🔹 LECTURA
  // =========================================================
  async findAll(role: Role, userId: string): Promise<MembershipResponseDto[]> {
    const data =
      role === Role.ADMIN || role === Role.STAFF
        ? await this.repo.findAll()
        : await this.repo.findByUser(userId);

    const filtered =
      role === Role.CLIENT
        ? data.filter((m) => m.status === MembershipStatus.ACTIVE)
        : data;

    return filtered.map((m) => this.toResponse(m));
  }

  async findById(id: string, userId: string, role: Role) {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');
    if (role === Role.CLIENT && membership.userId !== userId)
      throw new ForbiddenException('No puedes acceder a esta membresía');

    return this.toResponse(membership);
  }

  async findByUser(userId: string) {
    const data = await this.repo.findByUser(userId);
    return data.map((m) => this.toResponse(m));
  }

  // =========================================================
  // 🔹 ACTUALIZACIÓN / RENOVACIÓN
  // =========================================================
  async update(id: string, dto: UpdateMembershipDto) {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');

    // Si hay cambio de plan, recalculamos fechas y precios
    if (dto.planId) {
      const plan = await this.repo.findPlanById(dto.planId);
      if (!plan) throw new NotFoundException('Plan de membresía no encontrado');
      const now = new Date();
      const newEnd = new Date(now);
      newEnd.setDate(now.getDate() + plan.durationDays);
      dto.endDate = dto.endDate ?? newEnd.toISOString();
      dto.priceSnapshot = Number(plan.price);
      dto.currency = plan.currency ?? 'MXN';
    }

    const updated = await this.repo.update(id, dto);
    this.logger.log(`🧩 Membresía actualizada: ${id}`);
    return this.toResponse(updated);
  }

  async renewMembership(id: string, extraDays: number) {
    const membership = await this.repo.findById(id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');

    const newEnd = new Date(membership.endDate);
    newEnd.setDate(newEnd.getDate() + extraDays);

    const renewed = await this.repo.update(id, {
      endDate: newEnd,
      status: MembershipStatus.ACTIVE,
    });

    this.logger.log(`🔁 Membresía renovada ${id} (+${extraDays} días)`);
    return this.toResponse(renewed);
  }

  // =========================================================
  // 🔹 ELIMINACIÓN Y EXPIRACIÓN
  // =========================================================
  async remove(id: string) {
    const m = await this.repo.findById(id);
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.repo.delete(id);
    this.logger.warn(`🗑️ Membresía eliminada: ${id}`);
  }

  async checkExpiredMemberships() {
    const now = new Date();
    const updated = await this.repo.expireAllBefore(now);
    if (updated > 0)
      this.logger.warn(`⚠️ ${updated} membresías marcadas como expiradas`);
    return { updated };
  }

  async previewExpiredCandidates() {
    return this.repo.findCandidatesToExpire(new Date());
  }

  // =========================================================
  // 🔹 HELPERS
  // =========================================================
  private toResponse(m: any): MembershipResponseDto {
    return {
      id: m.id,
      userId: m.userId,
      planId: m.planId,
      planName: m.plan?.name ?? null,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status,
      priceSnapshot: Number(m.priceSnapshot ?? 0),
      currency: m.currency ?? 'MXN',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  async findAllWithRelationsRaw() {
    return this.repo.findAllWithRelations();
  }
}
