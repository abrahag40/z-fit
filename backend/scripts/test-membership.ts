/**
 * 🔬 Script QA: Crear membresías de prueba para validar integración con el backend
 * ---------------------------------------------------------------------------------
 * Este script crea una membresía activa para un usuario existente, tomando en cuenta:
 * - Los planes disponibles (`MembershipPlan`)
 * - La relación `priceSnapshot`
 * - Las fechas de inicio y expiración automáticas
 *
 * Se ejecuta con:
 *    npx ts-node scripts/test-membership.ts
 */

import { PrismaClient, MembershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando test de membresía...');

  // 1️⃣ Obtener un usuario cliente existente
  const user = await prisma.user.findFirst({
    where: { role: 'CLIENT' },
  });

  if (!user) {
    console.error('❌ No se encontró un usuario CLIENT. Crea uno antes de continuar.');
    return;
  }

  // 2️⃣ Buscar un plan activo (típicamente el más barato o el primero)
  const plan = await prisma.membershipPlan.findFirst({
    where: { active: true },
    orderBy: { price: 'asc' },
  });

  if (!plan) {
    console.error('❌ No hay planes activos. Ejecuta primero el seed de MembershipPlan.');
    return;
  }

  // 3️⃣ Calcular fechas de inicio y fin
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // 4️⃣ Crear la membresía real
  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      status: MembershipStatus.ACTIVE,
      startDate,
      endDate,
      planId: plan.id,
      priceSnapshot: plan.price,
      currency: 'MXN',
    },
    include: { plan: true, user: true },
  });

  console.log('✅ Membresía creada con éxito:');
  console.table({
    ID: membership.id,
    Usuario: membership.user?.email,
    Plan: membership.plan?.name,
    Precio: membership.priceSnapshot?.toString(),
    Estado: membership.status,
    Fin: membership.endDate.toISOString(),
  });

  // 5️⃣ Verificar pagos vinculados
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      membershipId: membership.id,
      amount: plan.price,
      currency: 'MXN',
      status: 'PAID',
      method: 'CASH',
      reference: `QA-${Date.now()}`,
      paidAt: new Date(),
    },
  });

  console.log('💵 Pago generado:');
  console.table({
    ID: payment.id,
    Monto: payment.amount.toString(),
    Estado: payment.status,
    Método: payment.method,
    Fecha: payment.paidAt?.toISOString(),
  });

  console.log('🏁 Test finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en test-membership:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
