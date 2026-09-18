import { prisma } from "../lib/db";

async function main() {
  const store = await prisma.store.findFirst();
  if (store) {
    await prisma.store.update({
      where: { id: store.id },
      data: { code: "123456" },
    });
    console.log(`Do‘kon kodi muvaffaqiyatli 123456 qilindi: ${store.name}`);
  }
}

main().finally(() => prisma.$disconnect());
