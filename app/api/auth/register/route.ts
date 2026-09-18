import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || "Ma'lumotlar noto‘g‘ri kiritildi";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { storeName, firstName, lastName, phone, pin } = parseResult.data;

    // Mavjud foydalanuvchini tekshirish
    const existingUser = await prisma.user.findUnique({
      where: { normalizedPhone: phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu telefon raqami allaqachon ro‘yxatdan o‘tgan. Iltimos, Kirish sahifasidan kiring." },
        { status: 409 }
      );
    }

    // Parolni heshlash
    const passwordHash = await hashPassword(pin);

    // Tranzaksiya bilan do'kon va egasini yaratish
    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName.trim(),
          status: "ACTIVE",
        },
      });

      const user = await tx.user.create({
        data: {
          storeId: store.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: body.phone,
          normalizedPhone: phone,
          passwordHash,
          role: "OWNER",
        },
      });

      return { store, user };
    });

    // IP va User-Agent ma'lumotlarini olish (ixtiyoriy security audit uchun)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Sessiya yaratish
    await createSession(result.user.id, result.store.id, ip, userAgent);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone,
        role: result.user.role,
      },
      store: {
        id: result.store.id,
        name: result.store.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Ma'lumotni saqlashda xatolik yuz berdi. Qayta urinib ko‘ring." },
      { status: 500 }
    );
  }
}
