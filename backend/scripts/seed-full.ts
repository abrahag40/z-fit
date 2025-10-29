import {
  PrismaClient,
  Role,
  MembershipStatus,
  PaymentMethod,
  PaymentStatus,
  CheckinStatus,
  Prisma,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Iniciando SEED COMPLETO QA...\n');

  // 🧹 Limpieza total
  await prisma.checkin.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.user.deleteMany();

  // 👥 Usuarios
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: 'admin@gym.dev',
        name: 'Admin Gym',
        passwordHash: 'hashed_admin_password',
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@gym.dev',
        name: 'Carlos Staff',
        passwordHash: 'hashed_staff_password',
        role: Role.STAFF,
      },
    }),
    prisma.user.create({
      data: {
        email: 'juan@gym.dev',
        name: 'Juan Pérez',
        passwordHash: 'hash1',
        role: Role.CLIENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@gym.dev',
        name: 'María López',
        passwordHash: 'hash2',
        role: Role.CLIENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'luis@gym.dev',
        name: 'Luis Gómez',
        passwordHash: 'hash3',
        role: Role.CLIENT,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@gym.dev',
        name: 'Sofía Torres',
        passwordHash: 'hash4',
        role: Role.CLIENT,
      },
    }),
  ]);
  const [admin, staff, juan, maria, luis, sofia] = users;
  console.log('✅ Usuarios creados:', users.map(u => u.email).join(', '));

  // 🏋️ Planes
  const plans = await prisma.$transaction([
    prisma.membershipPlan.create({
      data: { name: 'Básico 30d', price: 499, durationDays: 30 },
    }),
    prisma.membershipPlan.create({
      data: { name: 'Premium 30d', price: 699, durationDays: 30 },
    }),
    prisma.membershipPlan.create({
      data: { name: 'Anual Elite', price: 5999, durationDays: 365 },
    }),
  ]);
  const [planBasic, planPremium, planElite] = plans;
  console.log('✅ Planes creados:', plans.map(p => p.name).join(', '));

  // 🧾 Membresías diversificadas
  const today = new Date();

  const memberships = await prisma.$transaction([
    // Activa
    prisma.membership.create({
      data: {
        userId: juan.id,
        planId: planBasic.id,
        status: MembershipStatus.ACTIVE,
        startDate: today,
        endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 30),
        priceSnapshot: planBasic.price,
      },
    }),
    // Expirada
    prisma.membership.create({
      data: {
        userId: maria.id,
        planId: planPremium.id,
        status: MembershipStatus.EXPIRED,
        startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 60),
        endDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30),
        priceSnapshot: planPremium.price,
      },
    }),
    // Congelada
    prisma.membership.create({
      data: {
        userId: luis.id,
        planId: planBasic.id,
        status: MembershipStatus.FROZEN,
        startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15),
        endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 15),
        priceSnapshot: planBasic.price,
      },
    }),
    // Activa (anual)
    prisma.membership.create({
      data: {
        userId: sofia.id,
        planId: planElite.id,
        status: MembershipStatus.ACTIVE,
        startDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30),
        endDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 365),
        priceSnapshot: planElite.price,
      },
    }),
  ]);

  const [mJuan, mMaria, mLuis, mSofia] = memberships;
  console.log('✅ Membresías creadas para clientes.');

  // 💰 Pagos variados
  const methods = [
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.TRANSFER,
    PaymentMethod.STRIPE,
  ];

  const allPayments: Prisma.PaymentCreateManyInput[] = [];
  const clients = [juan, maria, luis, sofia];
  const theirMemberships = [mJuan, mMaria, mLuis, mSofia];

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const membership = theirMemberships[i];
    for (let j = 0; j < 2; j++) {
      const paidAt = new Date();
      paidAt.setDate(today.getDate() - (i * 5 + j * 2));
      allPayments.push({
        userId: client.id,
        membershipId: membership.id,
        amount: membership.priceSnapshot ?? 499,
        method: methods[(i + j) % methods.length],
        status: PaymentStatus.PAID,
        currency: 'MXN',
        paidAt,
        reference: `PAY-${client.name}-${Date.now()}-${j}`,
      });
    }
  }

  await prisma.payment.createMany({ data: allPayments });
  console.log('✅ Pagos generados:', allPayments.length);

  // 🕒 Check-ins simulados (últimos 7 días por usuario)
  const checkins: Prisma.CheckinCreateManyInput[] = [];
  for (const client of clients) {
    const membership = theirMemberships[clients.indexOf(client)];
    for (let i = 0; i < 7; i++) {
      const ts = new Date();
      ts.setDate(today.getDate() - i);
      checkins.push({
        userId: client.id,
        membershipId: membership.id,
        timestamp: ts,
        status: CheckinStatus.ALLOWED,
        notes: `Ingreso #${i + 1} de ${client.name}`,
      });
    }
  }

  await prisma.checkin.createMany({ data: checkins });
  console.log('✅ Check-ins creados:', checkins.length);

  console.log('\n🎯 SEED QA COMPLETO FINALIZADO CON ÉXITO 🎯');
}

main()
  .catch(e => {
    console.error('❌ Error durante el seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
