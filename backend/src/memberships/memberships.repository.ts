import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.membership.findUnique({
      where: { id },
      include: { plan: true, user: true },
    });
  }

  findAll() {
    return this.prisma.membership.findMany({
      include: { plan: true, user: true },
    });
  }

  findByUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: { plan: true },
    });
  }

  // ✅ Agrega este método para resolver el error
  findPlanById(planId: string) {
    return this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
  }

  // ✅ Y los auxiliares usados por el service
  async expireAllBefore(date: Date) {
    const result = await this.prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: date },
      },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }

  async findCandidatesToExpire(date: Date) {
    return this.prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: date },
      },
      select: { id: true, userId: true, endDate: true },
    });
  }

  async create(data: any) {
    return this.prisma.membership.create({
      data: {
        user: { connect: { id: data.userId } }, // ✅ conexión correcta
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        planId: data.planId,
        priceSnapshot: data.priceSnapshot,
        currency: data.currency,
      },
      include: { plan: true, user: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.membership.update({
      where: { id },
      data,
      include: { plan: true, user: true },
    });
  }

  async delete(id: string) {
    return this.prisma.membership.delete({ where: { id } });
  }
}
