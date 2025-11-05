/**
 * 🌱 SEED DEMO EXTENDIDO - ZaharDev Gym Manager
 * ------------------------------------------------------------
 * Este script crea un entorno de prueba realista para validar:
 * - Ciclo completo de usuarios (ADMIN, STAFF, CLIENTES)
 * - Membresías en todos los estados: ACTIVE, EXPIRED, FROZEN, CANCELLED
 * - Pagos de distintos tipos y métodos
 * - Check-ins permitidos, denegados y mixtos
 * - Fechas distribuidas para simular historial financiero y operativo
 */

import { PrismaClient, Role, MembershipStatus, PaymentStatus, PaymentMethod, CheckinStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando SEED DEMO EXTENDIDO de ZaharDev Gym Manager...\n');

  // =========================================================
  // 🧩 LIMPIEZA PREVIA DE TABLAS
  // =========================================================
  await prisma.checkin.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 Tablas limpiadas correctamente.\n');

  // =========================================================
  // 👥 CREACIÓN DE USUARIOS
  // =========================================================
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gym.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: Role.ADMIN,
      name: 'Administrador Principal',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@gym.com',
      passwordHash: await bcrypt.hash('Staff123!', 10),
      role: Role.STAFF,
      name: 'Personal Operativo',
    },
  });

  const clienteActivo = await prisma.user.create({
    data: {
      email: 'cliente.activo@gym.com',
      passwordHash: await bcrypt.hash('Cliente123!', 10),
      role: Role.CLIENT,
      name: 'Cliente Activo',
    },
  });

  const clienteVencido = await prisma.user.create({
    data: {
      email: 'cliente.vencido@gym.com',
      passwordHash: await bcrypt.hash('Cliente123!', 10),
      role: Role.CLIENT,
      name: 'Cliente Vencido',
    },
  });

  const clienteCongelado = await prisma.user.create({
    data: {
      email: 'cliente.frozen@gym.com',
      passwordHash: await bcrypt.hash('Cliente123!', 10),
      role: Role.CLIENT,
      name: 'Cliente Congelado',
    },
  });

  const clienteCancelado = await prisma.user.create({
    data: {
      email: 'cliente.cancelado@gym.com',
      passwordHash: await bcrypt.hash('Cliente123!', 10),
      role: Role.CLIENT,
      name: 'Cliente Cancelado',
    },
  });

  console.log('👥 Usuarios creados exitosamente.\n');

  // =========================================================
  // 💼 PLANES DE MEMBRESÍA
  // =========================================================
  const [planMensual, planTrimestral, planAnual] = await Promise.all([
    prisma.membershipPlan.create({
      data: { name: 'Plan Mensual', price: 500, durationDays: 30 },
    }),
    prisma.membershipPlan.create({
      data: { name: 'Plan Trimestral', price: 1300, durationDays: 90 },
    }),
    prisma.membershipPlan.create({
      data: { name: 'Plan Anual', price: 4800, durationDays: 365 },
    }),
  ]);

  console.log('💳 Planes de membresía creados correctamente.\n');

  // =========================================================
  // 🪪 MEMBRESÍAS EN VARIOS ESTADOS
  // =========================================================
  const hoy = new Date();

  const membershipActiva = await prisma.membership.create({
    data: {
      userId: clienteActivo.id,
      status: MembershipStatus.ACTIVE,
      startDate: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(hoy.getTime() + 20 * 24 * 60 * 60 * 1000),
      planId: planMensual.id,
      priceSnapshot: planMensual.price,
      currency: 'MXN',
    },
  });

  const membershipVencida = await prisma.membership.create({
    data: {
      userId: clienteVencido.id,
      status: MembershipStatus.EXPIRED,
      startDate: new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000),
      planId: planMensual.id,
      priceSnapshot: planMensual.price,
      currency: 'MXN',
    },
  });

  const membershipCongelada = await prisma.membership.create({
    data: {
      userId: clienteCongelado.id,
      status: MembershipStatus.FROZEN,
      startDate: new Date(hoy.getTime() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(hoy.getTime() + 50 * 24 * 60 * 60 * 1000),
      planId: planTrimestral.id,
      priceSnapshot: planTrimestral.price,
      currency: 'MXN',
    },
  });

  const membershipCancelada = await prisma.membership.create({
    data: {
      userId: clienteCancelado.id,
      status: MembershipStatus.CANCELLED,
      startDate: new Date(hoy.getTime() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000),
      planId: planAnual.id,
      priceSnapshot: planAnual.price,
      currency: 'MXN',
    },
  });

  console.log('🪪 Membresías creadas en varios estados.\n');

  // =========================================================
  // 💰 PAGOS SIMULADOS (VARIADOS)
  // =========================================================
  const pagos = [
    // Pagos activos
    {
      userId: clienteActivo.id,
      membershipId: membershipActiva.id,
      amount: 500,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      paidAt: new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: clienteActivo.id,
      membershipId: membershipActiva.id,
      amount: 1300,
      method: PaymentMethod.CARD,
      status: PaymentStatus.PAID,
      paidAt: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    // Pagos fallidos
    {
      userId: clienteVencido.id,
      membershipId: membershipVencida.id,
      amount: 500,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.FAILED,
      paidAt: new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    // Pagos reembolsados
    {
      userId: clienteCongelado.id,
      membershipId: membershipCongelada.id,
      amount: 1300,
      method: PaymentMethod.CARD,
      status: PaymentStatus.REFUNDED,
      paidAt: new Date(hoy.getTime() - 12 * 24 * 60 * 60 * 1000),
    },
    // Pago pendiente
    {
      userId: clienteCancelado.id,
      membershipId: membershipCancelada.id,
      amount: 4800,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.PENDING,
    },
  ];

  await prisma.payment.createMany({ data: pagos });
  console.log('💸 Pagos registrados con diferentes métodos y estados.\n');

  // =========================================================
  // 🏋️ CHECK-INS (Permitidos, Denegados, Mixtos)
  // =========================================================
  const checkins: any[] = [];

  // Cliente activo → 10 check-ins recientes (permitidos)
  for (let i = 0; i < 10; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 7);
    checkins.push({
      userId: clienteActivo.id,
      membershipId: membershipActiva.id,
      status: CheckinStatus.ALLOWED,
      timestamp: new Date(hoy.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000),
    });
  }

  // Cliente vencido → intentos denegados
  for (let i = 0; i < 3; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 14);
    checkins.push({
      userId: clienteVencido.id,
      membershipId: membershipVencida.id,
      status: CheckinStatus.DENIED,
      notes: 'Intento con membresía vencida',
      timestamp: new Date(hoy.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000),
    });
  }

  // Cliente congelado → sin actividad reciente
  for (let i = 0; i < 2; i++) {
    checkins.push({
      userId: clienteCongelado.id,
      membershipId: membershipCongelada.id,
      status: CheckinStatus.DENIED,
      notes: 'Membresía congelada, acceso restringido',
      timestamp: new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.checkin.createMany({ data: checkins });
  console.log('🏋️ Check-ins generados correctamente.\n');

  // =========================================================
  // 📊 RESUMEN FINAL EN CONSOLA
  // =========================================================
  console.log('✅ Seed demo extendido completado exitosamente.\n');
  console.log('👥 Usuarios creados:');
  console.log(`- ADMIN: ${admin.email} / Admin123!`);
  console.log(`- STAFF: ${staff.email} / Staff123!`);
  console.log(`- CLIENTE ACTIVO: ${clienteActivo.email} / Cliente123!`);
  console.log(`- CLIENTE VENCIDO: ${clienteVencido.email} / Cliente123!`);
  console.log(`- CLIENTE CONGELADO: ${clienteCongelado.email} / Cliente123!`);
  console.log(`- CLIENTE CANCELADO: ${clienteCancelado.email} / Cliente123!`);
  console.log('\n📈 Datos listos para pruebas E2E y dashboard financiero.');
  console.log('💡 Ejecuta los endpoints del dashboard para verificar métricas en tiempo real.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed extendido:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
