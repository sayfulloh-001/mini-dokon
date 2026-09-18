import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";

const SESSION_COOKIE_NAME = "dokon_session_token";
const SESSION_DURATION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface SessionData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    normalizedPhone: string;
    role: string;
  };
  store: {
    id: string;
    name: string;
    code?: string | null;
    ipAddress?: string | null;
    status: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Yangi sessiya yaratish va HttpOnly cookie'ga yozish
 */
export async function createSession(
  userId: string,
  storeId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      storeId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  } catch (e) {
    // Cookie o'rnatishda xatolik bo'lsa (masalan static render)
  }

  return { token, expiresAt };
}

/**
 * Cookie yoki 6 xonali kod orqali joriy sessiyani olish
 */
export async function getSession(req?: NextRequest): Promise<SessionData | null> {
  try {
    // 1. Agar requestda 6 xonali code parametri yoki header bo'lsa
    let storeCode: string | null = null;
    if (req) {
      const url = new URL(req.url);
      storeCode = url.searchParams.get("code") || req.headers.get("x-store-code");
    }

    if (storeCode) {
      const cleanCode = storeCode.replace(/\s+/g, "").trim();
      const storeByCode = await prisma.store.findFirst({
        where: {
          OR: [
            { code: cleanCode },
            { ipAddress: cleanCode },
            { id: cleanCode },
          ],
        },
        include: { users: true },
      });

      if (storeByCode && storeByCode.status === "ACTIVE") {
        const user = storeByCode.users[0] || {
          id: `temp-${storeByCode.id}`,
          firstName: "Do‘kon",
          lastName: "Egasi",
          phone: cleanCode,
          normalizedPhone: cleanCode,
          role: "OWNER",
        };

        return {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            normalizedPhone: user.normalizedPhone,
            role: user.role,
          },
          store: {
            id: storeByCode.id,
            name: storeByCode.name,
            code: storeByCode.code,
            ipAddress: storeByCode.ipAddress,
            status: storeByCode.status,
          },
          session: {
            id: `session-${storeByCode.id}`,
            token: "code_auth",
            expiresAt: new Date(Date.now() + 86400000),
          },
        };
      }
    }

    // 2. Cookie orqali tekshirish
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const dbSession = await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
        store: true,
      },
    });

    if (!dbSession) return null;

    if (new Date() > dbSession.expiresAt) {
      await prisma.session.delete({ where: { id: dbSession.id } }).catch(() => {});
      return null;
    }

    if (dbSession.store.status !== "ACTIVE") {
      return null;
    }

    return {
      user: {
        id: dbSession.user.id,
        firstName: dbSession.user.firstName,
        lastName: dbSession.user.lastName,
        phone: dbSession.user.phone,
        normalizedPhone: dbSession.user.normalizedPhone,
        role: dbSession.user.role,
      },
      store: {
        id: dbSession.store.id,
        name: dbSession.store.name,
        code: dbSession.store.code,
        ipAddress: dbSession.store.ipAddress,
        status: dbSession.store.status,
      },
      session: {
        id: dbSession.id,
        token: dbSession.token,
        expiresAt: dbSession.expiresAt,
      },
    };
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("getSession error:", err);
    return null;
  }
}

/**
 * Server API lari uchun autentifikatsiyani talab qilish.
 */
export async function requireAuth(req?: NextRequest): Promise<SessionData | null> {
  return getSession(req);
}

/**
 * Tizimdan chiqish (Logout)
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const sess = await prisma.session.findUnique({ where: { token } });
      if (sess) {
        await prisma.session.deleteMany({
          where: { storeId: sess.storeId },
        });
      } else {
        await prisma.session.deleteMany({
          where: { token },
        });
      }
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  } catch (err) {
    console.error("destroySession error:", err);
  }
}
