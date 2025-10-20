import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinStatus } from '@prisma/client';

/**
 * Repositorio encargado de todas las operaciones de BD
 * relacionadas con el módulo de check-ins.
 * 
 * Mantiene las consultas separadas de la lógica de negocio
 * (principio de responsabilidad única).
 */
@Injectable()
export class CheckinRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo registro de check-in
   */
  async create(data: {
    userId: string;
    membershipId?: string | null;
    status: CheckinStatus;
    notes?: string | null;
  }) {
    return this.prisma.checkin.create({
      data,
    });
  }

  /**
   * Listar todos los check-ins (para admin o dashboard)
   * Incluye usuario y membresía asociada
   */
  // findAll() {
  //   return this.prisma.checkin.findMany({
  //     orderBy: { timestamp: 'desc' },
  //     include: { user: true, membership: true },
  //   });
  // }
  async findAll() {
    return this.prisma.checkin.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        membership: {
          select: { id: true, status: true, endDate: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Buscar los check-ins de un usuario específico
   */
  async findByUser(userId: string) {
    return this.prisma.checkin.findMany({
      where: { userId },
      include: {
        membership: {
          select: { id: true, status: true, endDate: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Obtener los check-ins realizados en el día actual
   */
  async findToday() {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    return this.prisma.checkin.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
        membership: {
          select: { id: true, status: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
