import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils/phone";
import { z } from "zod";

const updateDebtorSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo‘lishi kerak"),
  lastName: z.string().optional().default(""),
  phone: z.string().min(9, "Telefon raqami noto‘g‘ri"),
  adjustmentAmount: z.number().int().optional(), // Balansni to‘g‘rilash uchun (ixtiyoriy)
  adjustmentReason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const debtor = await prisma.debtor.findFirst({
      where: {
        id,
        storeId: auth.store.id,
        deletedAt: null,
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!debtor) {
      return NextResponse.json({ error: "Qarzdor topilmadi" }, { status: 404 });
    }

    return NextResponse.json({ debtor });
  } catch (error) {
    console.error("Get debtor detail error:", error);
    return NextResponse.json({ error: "Qarzdor ma'lumotlarini yuklashda xatolik" }, { status: 500 });
  }
}

export async function PUT(
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
    const parseResult = updateDebtorSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Ma'lumotlar noto‘g‘ri";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { firstName, lastName, phone, adjustmentAmount, adjustmentReason } = parseResult.data;
    const normalized = normalizePhone(phone);

    const existing = await prisma.debtor.findFirst({
      where: { id, storeId: auth.store.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Qarzdor topilmadi" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let newBalance = existing.balance;

      // Balans to'g'rilash (ADJUSTMENT) bo'lsa:
      if (adjustmentAmount !== undefined && adjustmentAmount !== existing.balance) {
        const diff = adjustmentAmount - existing.balance;
        newBalance = adjustmentAmount;

        await tx.debtTransaction.create({
          data: {
            storeId: auth.store.id,
            debtorId: id,
            type: "ADJUSTMENT",
            amount: diff,
            description: adjustmentReason || "Balans qo‘lda to‘g‘rilandi",
          },
        });
      }

      return tx.debtor.update({
        where: { id },
        data: {
          firstName: firstName.trim(),
          lastName: (lastName || "").trim(),
          phone: body.phone,
          normalizedPhone: normalized,
          balance: newBalance,
        },
      });
    });

    return NextResponse.json({ success: true, debtor: updated });
  } catch (error) {
    console.error("Update debtor error:", error);
    return NextResponse.json({ error: "Qarzdorni tahrirlashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiyadan o‘tilmagan" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.debtor.findFirst({
      where: { id, storeId: auth.store.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Qarzdor topilmadi" }, { status: 404 });
    }

    // Soft delete (Arxivlash) - tarix saqlanadi
    await prisma.debtor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Qarzdor muvaffaqiyatli arxivlandi / o‘chirildi",
    });
  } catch (error) {
    console.error("Delete debtor error:", error);
    return NextResponse.json({ error: "Qarzdorni o‘chirishda xatolik" }, { status: 500 });
  }
}
