// backend/scripts/test-membership.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log('❌ No hay usuarios registrados. Ejecuta primero: npm run seed');
    process.exit(1);
  }

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      type: 'Mensual',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
      price: 500,
    },
  });

  console.log('✅ Membresía creada correctamente:');
  console.table(membership);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
