import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinStatus } from '@prisma/client';

@Injectable()
export class CheckinRepository {
  constructor(private prisma: PrismaService) {}

  create(data: { userId: string; membershipId?: string; status: CheckinStatus; notes?: string }) {
    return this.prisma.checkin.create({ data });
  }

  findAll() {
    return this.prisma.checkin.findMany({
      orderBy: { timestamp: 'desc' },
      include: { user: true, membership: true },
    });
  }

  findByUser(userId: string) {
    return this.prisma.checkin.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: { membership: true },
    });
  }

  findToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.checkin.findMany({
      where: { timestamp: { gte: start, lte: end } },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
    });
  }
}
