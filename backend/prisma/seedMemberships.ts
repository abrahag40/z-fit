// import { PrismaClient, Role, MembershipStatus } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Iniciando seed demo de usuarios y membresías...');

//   // --- ADMIN ---
//   const adminEmail = 'admin@zahardev.com';
//   const adminPassword = await bcrypt.hash('Admin123!', 10);
//   const admin = await prisma.user.upsert({
//     where: { email: adminEmail },
//     update: {},
//     create: {
//       email: adminEmail,
//       name: 'Administrador ZaharDev',
//       passwordHash: adminPassword,
//       role: Role.ADMIN,
//     },
//   });

//   // --- STAFF ---
//   const staffEmail = 'staff@zahardev.com';
//   const staffPassword = await bcrypt.hash('Staff123!', 10);
//   const staff = await prisma.user.upsert({
//     where: { email: staffEmail },
//     update: {},
//     create: {
//       email: staffEmail,
//       name: 'Entrenador Mario',
//       passwordHash: staffPassword,
//       role: Role.STAFF,
//     },
//   });

//   // --- CLIENTES ---
//   const clients = [
//     { email: 'cliente1@gym.com', name: 'Cliente Activo' },
//     { email: 'cliente2@gym.com', name: 'Cliente Vencido' },
//   ];

//   const passwords = await Promise.all([
//     bcrypt.hash('Cliente123!', 10),
//     bcrypt.hash('Cliente123!', 10),
//   ]);

//   const [clienteActivo, clienteVencido] = await Promise.all(
//     clients.map((c, i) =>
//       prisma.user.upsert({
//         where: { email: c.email },
//         update: {},
//         create: {
//           email: c.email,
//           name: c.name,
//           passwordHash: passwords[i],
//           role: Role.CLIENT,
//         },
//       }),
//     ),
//   );

//   // --- MEMBRESÍAS DEMO ---
//   const now = new Date();
//   const lastMonth = new Date(now);
//   lastMonth.setMonth(now.getMonth() - 1);

//   const nextMonth = new Date(now);
//   nextMonth.setMonth(now.getMonth() + 1);

//   await prisma.membership.createMany({
//     data: [
//       {
//         userId: clienteActivo.id,
//         type: 'Mensual',
//         startDate: lastMonth,
//         endDate: nextMonth,
//         price: 600,
//         status: MembershipStatus.ACTIVE,
//       },
//       {
//         userId: clienteVencido.id,
//         type: 'Mensual',
//         startDate: new Date('2024-06-01T00:00:00Z'),
//         endDate: new Date('2024-07-01T00:00:00Z'),
//         price: 600,
//         status: MembershipStatus.EXPIRED,
//       },
//       {
//         userId: clienteActivo.id,
//         type: 'Anual',
//         startDate: new Date('2025-01-01T00:00:00Z'),
//         endDate: new Date('2025-12-31T00:00:00Z'),
//         price: 5500,
//         status: MembershipStatus.FROZEN,
//       },
//     ],
//   });

//   console.log('✅ Seed demo completado exitosamente.');
//   console.log('Usuarios creados:');
//   console.log(`- ADMIN: ${admin.email} / Admin123!`);
//   console.log(`- STAFF: ${staff.email} / Staff123!`);
//   console.log(`- CLIENTE ACTIVO: ${clienteActivo.email} / Cliente123!`);
//   console.log(`- CLIENTE VENCIDO: ${clienteVencido.email} / Cliente123!`);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
