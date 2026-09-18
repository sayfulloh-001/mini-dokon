import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { saleSchema } from "@/lib/schemas";
import { getDateRange } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const { startDate, endDate } = getDateRange(period);

  const whereClause: {
    storeId: string;
    createdAt?: {
      gte?: Date;
      lte: Date;
    };
  } = {
    storeId: auth.store.id,
  };

  if (startDate) {
    whereClause.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  try {
    const sales = await prisma.saleTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const totalAmount = await prisma.saleTransaction.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      sales,
      total: totalAmount._sum.amount || 0,
      count: totalAmount._count || 0,
    });
  } catch (error) {
    console.error("Fetch sales error:", error);
    return NextResponse.json({ error: "Savdolarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = saleSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Summa noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { amount, note } = parseResult.data;

    const sale = await prisma.saleTransaction.create({
      data: {
        storeId: auth.store.id,
        amount,
        note: note ? note.trim() : null,
      },
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    console.error("Create sale error:", error);
    return NextResponse.json(
      { error: "Savdoni saqlashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
