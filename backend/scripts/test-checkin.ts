import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Buscar un usuario con rol CLIENT
  const user = await prisma.user.findFirst({ where: { role: 'CLIENT' } });

  if (!user) {
    console.error('❌ No se encontró ningún usuario con rol CLIENT. Ejecuta primero el seed demo.');
    return;
  }

  // Buscar su membresía activa SOLO si existe usuario
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
  });

  if (!membership) {
    console.error(`⚠️ El usuario ${user.email} no tiene una membresía activa.`);
    return;
  }

  // Crear el check-in
  const checkin = await prisma.checkin.create({
    data: {
      userId: user.id,
      membershipId: membership.id,
      status: 'ALLOWED',
      notes: 'Prueba manual desde seed',
    },
  });

  console.log('✅ Check-in creado correctamente:');
  console.table(checkin);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => prisma.$disconnect());
