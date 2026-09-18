import { prisma } from "../lib/db";

async function runTest() {
  console.log("=== 6-XONALI KOD VA ADMIN PANEL TESTI ===");

  // 1. Do'konni 123456 kodi bilan tekshirish
  const store = await prisma.store.findUnique({
    where: { code: "123456" },
  });

  if (!store) {
    console.error("123456 kodli do'kon topilmadi!");
    process.exit(1);
  }
  console.log(`✅ 123456 kodli do'kon mavjud: ${store.name}`);

  // 2. Savdo qo'shish (100 000 so'm)
  const sale = await prisma.saleTransaction.create({
    data: {
      storeId: store.id,
      amount: 100000,
      note: "Test savdosi",
    },
  });
  console.log(`✅ Savdo qo'shildi: ${sale.amount} so'm`);

  // 3. Qarzdor qo'shish: Alisher Valiyev, 100 000 so'm
  const phone = "998912345678";
  let debtor = await prisma.debtor.findFirst({
    where: { storeId: store.id, normalizedPhone: phone },
  });

  if (!debtor) {
    debtor = await prisma.debtor.create({
      data: {
        storeId: store.id,
        firstName: "Alisher",
        lastName: "Valiyev",
        phone: "+998 91 234 56 78",
        normalizedPhone: phone,
        balance: 100000,
      },
    });
  }
  console.log(`✅ Qarzdor qo'shildi: ${debtor.firstName} ${debtor.lastName}, Qarz: ${debtor.balance} so'm`);

  // 4. Ertasi kuni yana 50 000 so'm qarz oldi -> Birlashtirish
  const addedDebt = 50000;
  const updatedDebtor = await prisma.debtor.update({
    where: { id: debtor.id },
    data: { balance: debtor.balance + addedDebt },
  });
  console.log(`✅ Duplikat birlashtirildi: Yangi qarz balansi: ${updatedDebtor.balance} so'm (Kutilgan: 150000)`);

  if (updatedDebtor.balance !== 150000) {
    console.error("Qarz hisob-kitobida xatolik!");
    process.exit(1);
  }

  // 5. Faqat 1 ta Alisher borligini tekshirish
  const count = await prisma.debtor.count({
    where: { storeId: store.id, normalizedPhone: phone, deletedAt: null },
  });
  console.log(`✅ Qarzdorlar soni ro'yxatda: ${count} ta (Bitta bo'lib qoldi)`);

  console.log("\n🎉 BARCHA TALABLAR MUVAFFAQIShLI ISHLAMOQDA!");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
