import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { cashTransactionSchema } from "@/lib/schemas";
import { getDateRange } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "INCOME" or "EXPENSE" or null
  const period = searchParams.get("period") || "today";

  const { startDate, endDate } = getDateRange(period);

  const where: any = {
    storeId: auth.store.id,
  };

  if (type === "INCOME" || type === "EXPENSE") {
    where.type = type;
  }

  if (startDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  try {
    const transactions = await prisma.cashTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const incomeSum = await prisma.cashTransaction.aggregate({
      where: { ...where, type: "INCOME" },
      _sum: { amount: true },
    });

    const expenseSum = await prisma.cashTransaction.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      transactions,
      totalIncome: incomeSum._sum.amount || 0,
      totalExpense: expenseSum._sum.amount || 0,
    });
  } catch (error) {
    console.error("Fetch cash transactions error:", error);
    return NextResponse.json({ error: "Tranzaksiyalarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = cashTransactionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Ma'lumotlar noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { type, amount, description } = parseResult.data;

    const item = await prisma.cashTransaction.create({
      data: {
        storeId: auth.store.id,
        type,
        amount,
        description: description.trim(),
      },
    });

    return NextResponse.json({ success: true, transaction: item }, { status: 201 });
  } catch (error) {
    console.error("Create cash transaction error:", error);
    return NextResponse.json({ error: "Tranzaksiyani saqlashda xatolik" }, { status: 500 });
  }
}
