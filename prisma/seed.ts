import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Do'kon yaratish
  const store = await prisma.store.create({
    data: {
      name: "Sayfulloh Savdo",
      status: "ACTIVE",
    },
  });

  // 2. Parolni heshlash
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("1234", salt);

  // 3. Do'kon egasini yaratish
  const user = await prisma.user.create({
    data: {
      storeId: store.id,
      firstName: "Sayfulloh",
      lastName: "Aliyev",
      phone: "+998 90 123 45 67",
      normalizedPhone: "998901234567",
      passwordHash,
      role: "OWNER",
    },
  });

  // 4. Bugungi savdolarni yaratish
  const todaySales = [100000, 80000, 50000, 150000, 240000, 75000];
  for (const amount of todaySales) {
    await prisma.saleTransaction.create({
      data: {
        storeId: store.id,
        amount,
        note: "Kassadagi savdo",
      },
    });
  }

  // 5. Qarzdorlarni yaratish
  const debtor1 = await prisma.debtor.create({
    data: {
      storeId: store.id,
      firstName: "Akmal",
      lastName: "Karimov",
      phone: "+998 93 111 22 33",
      normalizedPhone: "998931112233",
      balance: 110000,
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor1.id,
      type: "DEBT_ADD",
      amount: 100000,
      description: "1-kun olingan qarz",
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor1.id,
      type: "DEBT_ADD",
      amount: 10000,
      description: "2-kun qo‘shimcha qarz",
    },
  });

  const debtor2 = await prisma.debtor.create({
    data: {
      storeId: store.id,
      firstName: "Jasur",
      lastName: "Rahimov",
      phone: "+998 97 999 88 77",
      normalizedPhone: "998979998877",
      balance: 90000,
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor2.id,
      type: "DEBT_ADD",
      amount: 110000,
      description: "Tovarlar uchun qarz",
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor2.id,
      type: "DEBT_PAYMENT",
      amount: 20000,
      description: "Qisman qaytarilgan to‘lov",
    },
  });

  // To'langan qarzdor (balance = 0)
  const debtor3 = await prisma.debtor.create({
    data: {
      storeId: store.id,
      firstName: "Nodir",
      lastName: "Umarov",
      phone: "+998 90 555 44 33",
      normalizedPhone: "998905554433",
      balance: 0,
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor3.id,
      type: "DEBT_ADD",
      amount: 100000,
      description: "Boshlang‘ich qarz",
    },
  });
  await prisma.debtTransaction.create({
    data: {
      storeId: store.id,
      debtorId: debtor3.id,
      type: "DEBT_PAYMENT",
      amount: 100000,
      description: "To‘liq to‘lab qutuldi",
    },
  });

  // 6. Chiqim va Kirim
  await prisma.cashTransaction.create({
    data: {
      storeId: store.id,
      type: "EXPENSE",
      amount: 150000,
      description: "Tushlik va xarajatlar",
    },
  });

  await prisma.cashTransaction.create({
    data: {
      storeId: store.id,
      type: "EXPENSE",
      amount: 200000,
      description: "Do‘kon elektr energiyasi uchun to‘lov",
    },
  });

  console.log("Seeding completed successfully!");
  console.log(`Do‘kon: ${store.name}`);
  console.log(`Telefon: ${user.phone}`);
  console.log(`PIN: 1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
