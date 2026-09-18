import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { debtAddSchema } from "@/lib/schemas";

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
    const parseResult = debtAddSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Qarz summasi noto‘g‘ri";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { amount, description } = parseResult.data;

    const debtor = await prisma.debtor.findFirst({
      where: { id, storeId: auth.store.id, deletedAt: null },
    });

    if (!debtor) {
      return NextResponse.json({ error: "Qarzdor topilmadi" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newBalance = debtor.balance + amount;

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
          type: "DEBT_ADD",
          amount,
          description: description || "Qo‘shimcha qarz berildi",
        },
      });

      return { updatedDebtor, transaction };
    });

    return NextResponse.json({
      success: true,
      debtor: result.updatedDebtor,
      message: `Qarz muvaffaqiyatli qo‘shildi. Jami qarz: ${result.updatedDebtor.balance.toLocaleString()} so‘m`,
    });
  } catch (error) {
    console.error("Add debt error:", error);
    return NextResponse.json({ error: "Qarzni qo‘shishda xatolik yuz berdi" }, { status: 500 });
  }
}
