import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Membership } from '@prisma/client';

@Injectable()
export class MembershipsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.MembershipCreateInput): Promise<Membership> {
    return this.prisma.membership.create({ data });
  }

  findAll(): Promise<Membership[]> {
    return this.prisma.membership.findMany({ include: { user: true } });
  }

  findById(id: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({ where: { id }, include: { user: true } });
  }

  findByUser(userId: string): Promise<Membership[]> {
    return this.prisma.membership.findMany({ where: { userId }, include: { user: true } });
  }

  update(id: string, data: Prisma.MembershipUpdateInput): Promise<Membership> {
    return this.prisma.membership.update({ where: { id }, data });
  }

  delete(id: string): Promise<Membership> {
    return this.prisma.membership.delete({ where: { id } });
  }

  // Nuevo método: contar y expirar en la base con un solo query
  async expireAllBefore(now: Date): Promise<number> {
    const res = await this.prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',             // o MembershipStatus.ACTIVE
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },     // o MembershipStatus.EXPIRED
    });
    return res.count;
  }

  // Diagnóstico: ver candidatos a expirar
  async findCandidatesToExpire(now: Date) {
    return this.prisma.membership.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      orderBy: { endDate: 'asc' },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });
  }
}
