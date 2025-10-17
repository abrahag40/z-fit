import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@zahardev.com';
  const adminPassword = 'Admin123!'; // ⚠️ cambiar antes de producción

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrador ZaharDev',
        passwordHash: hash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log('✅ Usuario administrador creado:', adminEmail);
  } else {
    console.log('ℹ️ El usuario administrador ya existe, no se creó otro.');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
