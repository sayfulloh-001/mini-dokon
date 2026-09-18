import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getDateRange } from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";

  const { startDate, endDate, label } = getDateRange(period);

  const storeId = auth.store.id;

  const dateFilter = startDate
    ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    : {};

  try {
    // 1. Savdo (Sales)
    const salesAgg = await prisma.saleTransaction.aggregate({
      where: {
        storeId,
        ...dateFilter,
      },
      _sum: { amount: true },
      _count: true,
    });
    const totalSales = salesAgg._sum.amount || 0;
    const salesCount = salesAgg._count || 0;

    // 2. Chiqim (Expense) va Kirim (Income)
    const incomeAgg = await prisma.cashTransaction.aggregate({
      where: {
        storeId,
        type: "INCOME",
        ...dateFilter,
      },
      _sum: { amount: true },
    });
    const totalIncome = incomeAgg._sum.amount || 0;

    const expenseAgg = await prisma.cashTransaction.aggregate({
      where: {
        storeId,
        type: "EXPENSE",
        ...dateFilter,
      },
      _sum: { amount: true },
    });
    const totalExpense = expenseAgg._sum.amount || 0;

    // 3. Qarz berilgan va to'langan (Debt activities in this period)
    const debtAddAgg = await prisma.debtTransaction.aggregate({
      where: {
        storeId,
        type: "DEBT_ADD",
        ...dateFilter,
      },
      _sum: { amount: true },
    });
    const periodDebtGiven = debtAddAgg._sum.amount || 0;

    const debtPayAgg = await prisma.debtTransaction.aggregate({
      where: {
        storeId,
        type: "DEBT_PAYMENT",
        ...dateFilter,
      },
      _sum: { amount: true },
    });
    const periodDebtCollected = debtPayAgg._sum.amount || 0;

    // 4. Bugungi tushum (24 soatlik kunlik tushum)
    const todayRange = getDateRange("today");
    const todaySalesAgg = await prisma.saleTransaction.aggregate({
      where: {
        storeId,
        createdAt: {
          gte: todayRange.startDate!,
          lte: todayRange.endDate,
        },
      },
      _sum: { amount: true },
      _count: true,
    });
    const todaySales = todaySalesAgg._sum.amount || 0;
    const todaySalesCount = todaySalesAgg._count || 0;

    // 5. Jami tushumlar (do'kondagi barcha davrlar savdosi)
    const allSalesAgg = await prisma.saleTransaction.aggregate({
      where: { storeId },
      _sum: { amount: true },
      _count: true,
    });
    const allTimeSales = allSalesAgg._sum.amount || 0;
    const allTimeSalesCount = allSalesAgg._count || 0;

    // 6. Do'kondagi joriy qarz holati (Active Debtors & Total Outstanding Debt)
    const currentDebtorStats = await prisma.debtor.aggregate({
      where: {
        storeId,
        deletedAt: null,
        balance: { gt: 0 },
      },
      _sum: { balance: true },
      _count: true,
    });
    const totalActiveDebt = currentDebtorStats._sum.balance || 0;
    const totalActiveDebtors = currentDebtorStats._count || 0;

    // 7. Sof natija (Savdo + Boshqa kirimlar - Chiqimlar)
    const netResult = totalSales + totalIncome - totalExpense;

    // 6. Oxirgi faoliyatlar (Activity feed)
    const recentSales = await prisma.saleTransaction.findMany({
      where: { storeId, ...dateFilter },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentCash = await prisma.cashTransaction.findMany({
      where: { storeId, ...dateFilter },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentDebtTx = await prisma.debtTransaction.findMany({
      where: { storeId, ...dateFilter },
      include: { debtor: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Birlashtirilgan va saralangan faoliyatlar ro'yxati
    const activities = [
      ...recentSales.map((s) => ({
        id: `sale-${s.id}`,
        type: "SALE" as const,
        amount: s.amount,
        title: "Savdo",
        description: s.note || "Kassadagi savdo",
        createdAt: s.createdAt,
      })),
      ...recentCash.map((c) => ({
        id: `cash-${c.id}`,
        type: c.type as "INCOME" | "EXPENSE",
        amount: c.amount,
        title: c.type === "INCOME" ? "Kirim" : "Chiqim",
        description: c.description,
        createdAt: c.createdAt,
      })),
      ...recentDebtTx.map((d) => ({
        id: `debt-${d.id}`,
        type: d.type as "DEBT_ADD" | "DEBT_PAYMENT" | "ADJUSTMENT",
        amount: d.amount,
        title:
          d.type === "DEBT_ADD"
            ? "Qarz berildi"
            : d.type === "DEBT_PAYMENT"
            ? "Qarz to‘landi"
            : "Qarz to‘g‘rilandi",
        description: `${d.debtor.firstName} ${d.debtor.lastName || ""}`.trim(),
        createdAt: d.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    return NextResponse.json({
      period,
      periodLabel: label,
      summary: {
        totalSales,
        salesCount,
        todaySales,
        todaySalesCount,
        allTimeSales,
        allTimeSalesCount,
        totalIncome,
        totalExpense,
        netResult,
        periodDebtGiven,
        periodDebtCollected,
        totalActiveDebt,
        totalActiveDebtors,
      },
      activities,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Statistikani yuklashda xatolik" }, { status: 500 });
  }
}
