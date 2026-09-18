import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { saleSchema } from "@/lib/schemas";

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
    const parseResult = saleSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Summa noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Mavjud savdoni tekshirish va IDOR himoyasi
    const existing = await prisma.saleTransaction.findFirst({
      where: { id, storeId: auth.store.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Savdo tranzaksiyasi topilmadi" }, { status: 404 });
    }

    const updated = await prisma.saleTransaction.update({
      where: { id },
      data: {
        amount: parseResult.data.amount,
        note: parseResult.data.note ? parseResult.data.note.trim() : null,
      },
    });

    return NextResponse.json({ success: true, sale: updated });
  } catch (error) {
    console.error("Update sale error:", error);
    return NextResponse.json({ error: "Savdoni yangilashda xatolik" }, { status: 500 });
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
    const existing = await prisma.saleTransaction.findFirst({
      where: { id, storeId: auth.store.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Savdo tranzaksiyasi topilmadi" }, { status: 404 });
    }

    await prisma.saleTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Savdo o‘chirildi" });
  } catch (error) {
    console.error("Delete sale error:", error);
    return NextResponse.json({ error: "Savdoni o‘chirishda xatolik" }, { status: 500 });
  }
}
