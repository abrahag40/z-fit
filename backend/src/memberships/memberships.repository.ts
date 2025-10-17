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
}
