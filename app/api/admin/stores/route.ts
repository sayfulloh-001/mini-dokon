import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 6 xonali tasodifiy noyob kod yaratish
async function generateUnique6DigitCode(): Promise<string> {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.store.findUnique({ where: { code } });
    if (!existing) return code;
  }
}

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            saleTransactions: true,
            debtors: true,
          },
        },
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Admin fetch stores error:", error);
    return NextResponse.json({ error: "Do‘konlarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    let code = (body.code || "").toString().replace(/\s+/g, "").trim();

    if (!name) {
      return NextResponse.json({ error: "Do‘kon nomini kiriting" }, { status: 400 });
    }

    if (!code) {
      code = await generateUnique6DigitCode();
    } else {
      // 6 xonali raqam ekanligini tekshirish
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: "Do‘kon ID si aynan 6 ta raqamdan iborat bo‘lishi kerak (masalan: 123456)" },
          { status: 400 }
        );
      }

      // Mavjudligini tekshirish
      const existing = await prisma.store.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          { error: `Ushbu ${code} kodli do‘kon allaqachon mavjud. Boshqa kod kiriting.` },
          { status: 409 }
        );
      }
    }

    const store = await prisma.store.create({
      data: {
        name,
        code,
        status: "ACTIVE",
        users: {
          create: {
            firstName: "Do‘kon",
            lastName: "Egasi",
            phone: code,
            normalizedPhone: `998000${code}`,
            passwordHash: "code_auth",
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ success: true, store }, { status: 201 });
  } catch (error) {
    console.error("Admin create store error:", error);
    return NextResponse.json({ error: "Do‘konni saqlashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kiritilmagan" }, { status: 400 });
    }

    await prisma.store.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Do‘kon o‘chirildi" });
  } catch (error) {
    console.error("Admin delete store error:", error);
    return NextResponse.json({ error: "Do‘konni o‘chirishda xatolik" }, { status: 500 });
  }
}
