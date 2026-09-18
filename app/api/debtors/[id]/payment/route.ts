import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { debtPaymentSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parseResult = debtPaymentSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "To‘lov summasi noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { amount, description } = parseResult.data;

    // Qarzdorni tekshirish
    const debtor = await prisma.debtor.findFirst({
      where: { id, storeId: auth.store.id, deletedAt: null },
    });

    if (!debtor) {
      return NextResponse.json({ error: "Qarzdor topilmadi" }, { status: 404 });
    }

    if (debtor.balance <= 0) {
      return NextResponse.json(
        { error: "Ushbu mijozning qarz balansi allaqachon 0 so‘m." },
        { status: 400 }
      );
    }

    // Tranzaksiya bilan to'lovni yozish va balansni yangilash
    const result = await prisma.$transaction(async (tx) => {
      // Yangi balans (0 dan kam bo'lmaydi)
      const newBalance = Math.max(0, debtor.balance - amount);

      const updatedDebtor = await tx.debtor.update({
        where: { id },
        data: {
          balance: newBalance,
        },
      });

      const transaction = await tx.debtTransaction.create({
        data: {
          storeId: auth.store.id,
          debtorId: id,
          type: "DEBT_PAYMENT",
          amount,
          description: description || (newBalance === 0 ? "To‘liq to‘lov" : "Qisman to‘lov"),
        },
      });

      return { updatedDebtor, transaction, isFullyPaid: newBalance === 0 };
    });

    return NextResponse.json({
      success: true,
      debtor: result.updatedDebtor,
      isFullyPaid: result.isFullyPaid,
      message: result.isFullyPaid
        ? "Qarz to‘liq to‘landi! Mijoz faol qarzdorlar ro‘yxatidan chiqarildi."
        : `To‘lov qabul qilindi. Qolgan qarz: ${result.updatedDebtor.balance.toLocaleString()} so‘m`,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "To‘lovni saqlashda xatolik yuz berdi" }, { status: 500 });
  }
}
