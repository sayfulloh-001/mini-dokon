import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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
    const existing = await prisma.cashTransaction.findFirst({
      where: { id, storeId: auth.store.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tranzaksiya topilmadi" }, { status: 404 });
    }

    await prisma.cashTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Tranzaksiya o‘chirildi" });
  } catch (error) {
    console.error("Delete cash error:", error);
    return NextResponse.json({ error: "Tranzaksiyani o‘chirishda xatolik" }, { status: 500 });
  }
}
