import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { debtorSchema } from "@/lib/schemas";
import { normalizePhone } from "@/lib/utils/phone";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const filter = searchParams.get("filter") || "active"; // "active", "paid", "all"

  try {
    const where: any = {
      storeId: auth.store.id,
      deletedAt: null,
    };

    if (filter === "active") {
      where.balance = { gt: 0 };
    } else if (filter === "paid") {
      where.balance = 0;
    }

    if (q) {
      const cleanDigits = q.replace(/\D/g, "");
      const searchTerms = q.split(/\s+/).filter(Boolean);

      const conditions: any[] = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];

      // Agar ikki so'z kiritilgan bo'lsa (masalan: "Sayfulloh Aliyev")
      if (searchTerms.length >= 2) {
        conditions.push({
          AND: [
            { firstName: { contains: searchTerms[0] } },
            { lastName: { contains: searchTerms[1] } },
          ],
        });
      }

      // Agar raqamlar bo'lsa (to'liq raqam yoki oxirgi 4 raqam)
      if (cleanDigits.length > 0) {
        conditions.push({ normalizedPhone: { contains: cleanDigits } });
        if (cleanDigits.length >= 4) {
          conditions.push({ normalizedPhone: { endsWith: cleanDigits } });
        }
      }

      where.OR = conditions;
    }

    const debtors = await prisma.debtor.findMany({
      where,
      orderBy: [{ balance: "desc" }, { updatedAt: "desc" }],
    });

    // Jami statistika (do'kondagi faol qarzdorlar soni va jami qarz)
    const activeStats = await prisma.debtor.aggregate({
      where: {
        storeId: auth.store.id,
        deletedAt: null,
        balance: { gt: 0 },
      },
      _sum: { balance: true },
      _count: true,
    });

    return NextResponse.json({
      debtors,
      totalActiveDebt: activeStats._sum.balance || 0,
      totalActiveDebtors: activeStats._count || 0,
    });
  } catch (error) {
    console.error("Fetch debtors error:", error);
    return NextResponse.json({ error: "Qarzdorlarni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = debtorSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Ma'lumotlar noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { firstName, lastName, phone, initialDebt, description } = parseResult.data;

    // Mavjud qarzdorni shu do'konda qidirish (telefon raqami yoki Ism + Familiya bo'yicha)
    const existingDebtor = await prisma.debtor.findFirst({
      where: {
        storeId: auth.store.id,
        OR: [
          { normalizedPhone: phone },
          {
            AND: [
              { firstName: firstName.trim() },
              { lastName: (lastName || "").trim() },
            ],
          },
        ],
      },
    });

    let resultDebtor;
    let isMerged = false;

    if (existingDebtor) {
      // DUPLIKAT OLDINI OLISH:
      // Mavjud qarzdor topildi. Balansni oshiramiz va tranzaksiya yozamiz.
      isMerged = true;
      resultDebtor = await prisma.$transaction(async (tx) => {
        const newBalance = existingDebtor.balance + initialDebt;

        const updated = await tx.debtor.update({
          where: { id: existingDebtor.id },
          data: {
            balance: newBalance,
            deletedAt: null, // Agar arxivlangan bo'lsa qayta faollashtirish
            // Agar yangi ism berilgan bo'lsa yangilash
            firstName: firstName || existingDebtor.firstName,
            lastName: lastName || existingDebtor.lastName,
          },
        });

        if (initialDebt > 0) {
          await tx.debtTransaction.create({
            data: {
              storeId: auth.store.id,
              debtorId: existingDebtor.id,
              type: "DEBT_ADD",
              amount: initialDebt,
              description: description || "Qo‘shimcha qarz berildi",
            },
          });
        }

        return updated;
      });
    } else {
      // Yangi qarzdor yaratish
      resultDebtor = await prisma.$transaction(async (tx) => {
        const debtor = await tx.debtor.create({
          data: {
            storeId: auth.store.id,
            firstName: firstName.trim(),
            lastName: (lastName || "").trim(),
            phone: body.phone,
            normalizedPhone: phone,
            balance: initialDebt,
          },
        });

        if (initialDebt > 0) {
          await tx.debtTransaction.create({
            data: {
              storeId: auth.store.id,
              debtorId: debtor.id,
              type: "DEBT_ADD",
              amount: initialDebt,
              description: description || "Boshlang‘ich qarz",
            },
          });
        }

        return debtor;
      });
    }

    return NextResponse.json(
      {
        success: true,
        debtor: resultDebtor,
        isMerged,
        message: isMerged
          ? "Bu telefon raqamli qarzdor mavjud edi. Qarz summasi uning hisobiga qo‘shildi!"
          : "Yangi qarzdor muvaffaqiyatli saqlandi!",
      },
      { status: isMerged ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create debtor error:", error);
    return NextResponse.json(
      { error: "Qarzdorni saqlashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
