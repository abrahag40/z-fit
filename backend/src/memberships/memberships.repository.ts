// src/memberships/memberships.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipStatus, Prisma } from '@prisma/client';

/**
 * Tipos internos del repositorio para evitar "any"
 */
type RepoCreateData = {
  userId: string;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
  planId?: string | null;
  priceSnapshot?: Prisma.Decimal | number | null;
  currency?: string | null;
};

type RepoUpdateData = {
  // Campos permitidos en update (filtrados en el Service a partir del DTO)
  status?: MembershipStatus;
  endDate?: Date | string; // el Service puede pasar string ISO; aquí lo normalizamos
  planId?: string | null;
  priceSnapshot?: Prisma.Decimal | number | null;
  currency?: string | null;
};

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // 🔹 LECTURA
  // =========================================================

  /**
   * Obtiene una membresía por ID con user + plan
   */
  findById(id: string) {
    return this.prisma.membership.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
    });
  }

  // ← este es el que usaremos en el endpoint de debug
  findAllWithRelations() {
    return this.prisma.membership.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista todas las membresías (ordenadas) con user + plan
   */
  findAll() {
    return this.prisma.membership.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            durationDays: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista membresías por usuario con user + plan
   */
  findByUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true, // 👈 obligatorio
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            durationDays: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista membresías por status (útil para dashboards o QA)
   */
  findByStatus(status: MembershipStatus) {
    return this.prisma.membership.findMany({
      where: { status },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Membresías activas (todas)
   */
  findActive() {
    return this.findByStatus(MembershipStatus.ACTIVE);
  }

  /**
   * Membresías activas de CLIENTES (no admin/staff)
   */
  async findActiveClients() {
    const data = await this.prisma.membership.findMany({
      where: { status: MembershipStatus.ACTIVE },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.filter(m => m.user?.role === 'CLIENT');
  }

  /**
   * Búsqueda paginada y ordenada (opcional, útil para vistas grandes)
   */
  findManyPaged(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MembershipWhereInput;
    orderBy?: Prisma.MembershipOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.membership.findMany({
      skip,
      take,
      where,
      orderBy: orderBy ?? { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
    });
  }

  // =========================================================
  // 🔹 PLANES
  // =========================================================

  /**
   * Necesario para crear/actualizar con cambio de plan (Service)
   */
  findPlanById(planId: string) {
    return this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
  }

  // =========================================================
  // 🔹 EXPIRACIÓN / AUDITORÍA
  // =========================================================

  async expireAllBefore(date: Date) {
    const result = await this.prisma.membership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: { lt: date },
      },
      data: { status: MembershipStatus.EXPIRED },
    });
    return result.count;
  }

  async findCandidatesToExpire(date: Date) {
    return this.prisma.membership.findMany({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: { lt: date },
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  // =========================================================
  // 🔹 CREACIÓN / ACTUALIZACIÓN / BORRADO
  // =========================================================

  /**
   * Crea la membresía conectando al usuario por id.
   * Nota: dejamos que el Service valide el DTO.
   */
  async create(data: RepoCreateData) {
    const createData: any = {
      user: { connect: { id: data.userId } },
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      priceSnapshot: data.priceSnapshot ?? null,
      currency: data.currency ?? 'MXN',
    };

    // Si existe planId, conectamos el plan
    if (data.planId) {
      createData.plan = { connect: { id: data.planId } };
    }

    return this.prisma.membership.create({
      data: createData,
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
    });
  }

  /**
   * Actualiza solo campos permitidos; normaliza endDate string→Date
   */
  async update(id: string, data: RepoUpdateData) {
    const normalized: Prisma.MembershipUpdateInput = {
      status: data.status,
      endDate: data.endDate
        ? typeof data.endDate === 'string'
          ? new Date(data.endDate)
          : data.endDate
        : undefined,
      priceSnapshot: data.priceSnapshot ?? undefined,
      currency: data.currency ?? undefined,
    };

    // Si hay cambio de plan, usamos la relación plan
    if (data.planId) {
      normalized.plan = { connect: { id: data.planId } };
    }

    return this.prisma.membership.update({
      where: { id },
      data: normalized,
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        plan: { select: { id: true, name: true, price: true, durationDays: true, currency: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.membership.delete({ where: { id } });
  }
}
