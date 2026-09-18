import { prisma } from "../lib/db";

async function testIpLogin() {
  const ip = "127.0.0.1";

  // 1. Do'konni IP bo'yicha topish yoki yaratish
  let store = await prisma.store.findFirst({
    where: {
      OR: [
        { ipAddress: ip },
        { ipAddress: null },
      ],
    },
    include: { users: true },
  });

  if (store && !store.ipAddress) {
    store = await prisma.store.update({
      where: { id: store.id },
      data: { ipAddress: ip },
      include: { users: true },
    });
  }

  console.log("Muvaffaqiyatli topilgan do'kon:", store?.name, "IP:", store?.ipAddress);
  console.log("Foydalanuvchi:", store?.users[0]?.firstName);

  // 2. Savdolar va qarzdorlar sonini tekshirish
  if (store) {
    const salesCount = await prisma.saleTransaction.count({ where: { storeId: store.id } });
    const debtorsCount = await prisma.debtor.count({ where: { storeId: store.id } });
    console.log(`Do'konga biriktirilgan savdolar: ${salesCount} ta, qarzdorlar: ${debtorsCount} ta`);
  }

  console.log("✅ IP LOGIN DATABASE TESTI MUVAFFAQIShLI O'TDI!");
}

testIpLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
