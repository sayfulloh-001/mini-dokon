import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

function getAllowedStoreIds(): string[] {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/STORE_IDS=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1]
          .split(",")
          .map((s) => s.trim().replace(/\s+/g, ""))
          .filter(Boolean);
      }
    }
  } catch (e) {
    // fallback
  }

  if (process.env.STORE_IDS) {
    return process.env.STORE_IDS.split(",")
      .map((s) => s.trim().replace(/\s+/g, ""))
      .filter(Boolean);
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = (body.code || body.ip || "").toString().replace(/\s+/g, "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Do‘kon IP manzili yoki 6 xonali kodini kiriting" },
        { status: 400 }
      );
    }

    // 1. .env faylidagi ruxsat etilgan do'kon ID va IP lari tekshiruvi (fayldan jonli o'qiladi)
    const envStoreIds = getAllowedStoreIds();

    if (envStoreIds.length > 0 && !envStoreIds.includes(rawInput)) {
      return NextResponse.json(
        {
          error: "Ushbu IP yoki ID uchun tizimga kirish ruxsati berilmagan (.env faylida mavjud emas)",
        },
        { status: 403 }
      );
    }

    // 2. Do'konni qidirish (IP yoki Code yoki ID bo'yicha)
    let store = await prisma.store.findFirst({
      where: {
        OR: [
          { ipAddress: rawInput },
          { code: rawInput },
          { id: rawInput },
        ],
      },
      include: { users: true },
    });

    // 3. Agar do'kon hali bazada bo'lmasa, avtomatik yaratish
    if (!store) {
      const isIp = rawInput.includes(".") || rawInput === "localhost";
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      store = await prisma.store.create({
        data: {
          name: isIp ? `Do‘kon (${rawInput})` : `Do‘kon #${rawInput}`,
          ipAddress: isIp ? rawInput : null,
          code: isIp ? randomCode : rawInput,
          status: "ACTIVE",
          users: {
            create: {
              firstName: "Do‘kon",
              lastName: "Egasi",
              phone: rawInput,
              normalizedPhone: `998${rawInput.replace(/\D/g, "").slice(-9)}` || "998901234567",
              passwordHash: "env_auth",
              role: "OWNER",
            },
          },
        },
        include: { users: true },
      });
    }

    if (!store) {
      return NextResponse.json(
        {
          error: "Bunday IP yoki ID kodli do‘kon topilmadi. Qayta tekshirib kiriting.",
        },
        { status: 404 }
      );
    }

    // Default foydalanuvchini olish yoki yaratish
    let user = store.users[0];
    if (!user) {
      user = await prisma.user.create({
        data: {
          storeId: store.id,
          firstName: "Do‘kon",
          lastName: "Egasi",
          phone: store.code || rawInput,
          normalizedPhone: `998000${(store.code || "123456").slice(-6)}`,
          passwordHash: "code_auth",
          role: "OWNER",
        },
      });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // 4. BIR VAQTDA FAQAT 1 TA ODAM / 1 TA QURILMA CHEKLOVI
    const cookieStore = await cookies();
    const currentToken = cookieStore.get("dokon_session_token")?.value;

    const activeSession = await prisma.session.findFirst({
      where: {
        storeId: store.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // Agar bu do'konga boshqa qurilmadan kirilgan bo'lsa va hali chiqilmagan bo'lsa
    if (activeSession && activeSession.token !== currentToken) {
      return NextResponse.json(
        {
          error:
            "Ushbu do‘konga boshqa qurilmadan kirilgan! Yangi qurilmadan kirish uchun avval o‘sha qurilmadan 'Chiqish' tugmasi bosilishi kerak.",
        },
        { status: 403 }
      );
    }

    // Eski sessiyalarni tozalab, bitta yangi faol sessiya yaratish
    await prisma.session.deleteMany({
      where: { storeId: store.id },
    });

    // Sessiya yaratish
    await createSession(user.id, store.id, clientIp, userAgent);

    return NextResponse.json({
      success: true,
      isAdmin: false,
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        ipAddress: store.ipAddress,
      },
      redirectUrl: `/hisob?code=${store.code || store.ipAddress || rawInput}`,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Tizimga kirishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
