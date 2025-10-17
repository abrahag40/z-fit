import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  // Obtenemos todos los usuarios (por ahora no habrá ninguno)
  const users = await prisma.user.findMany();
  console.log('Usuarios existentes:', users);

  await prisma.$disconnect();
}

main()
  .then(() => console.log('✅ Prisma conectado correctamente'))
  .catch((e) => {
    console.error('❌ Error al conectar con Prisma:', e);
    process.exit(1);
  });

  // npx prisma migrate dev --name add_auth_user_model
