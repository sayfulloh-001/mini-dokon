import { z } from "zod";
import { normalizePhone } from "./utils/phone";

export const registerSchema = z.object({
  storeName: z
    .string()
    .min(2, "Do‘kon nomi kamida 2 ta belgidan iborat bo‘lishi kerak")
    .max(100, "Do‘kon nomi juda uzun"),
  firstName: z
    .string()
    .min(2, "Ism kamida 2 ta belgidan iborat bo‘lishi kerak")
    .max(50, "Ism juda uzun"),
  lastName: z
    .string()
    .min(2, "Familiya kamida 2 ta belgidan iborat bo‘lishi kerak")
    .max(50, "Familiya juda uzun"),
  phone: z
    .string()
    .min(9, "Telefon raqami noto‘g‘ri kiritildi")
    .transform((val) => normalizePhone(val))
    .refine((val) => val.length === 12 && val.startsWith("998"), {
      message: "Telefon raqami O‘zbekiston formati (+998...) bo‘lishi kerak",
    }),
  pin: z
    .string()
    .min(4, "PIN yoki parol kamida 4 ta belgidan iborat bo‘lishi kerak")
    .max(50, "Parol juda uzun"),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(9, "Telefon raqami kiritilishi shart")
    .transform((val) => normalizePhone(val)),
  pin: z
    .string()
    .min(1, "PIN yoki parol kiritilishi shart"),
});

export const saleSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Summa raqam bo‘lishi kerak" })
    .int("Summa butun son bo‘lishi kerak")
    .positive("Summa 0 dan katta bo‘lishi kerak")
    .max(10000000000, "Summa juda katta"),
  note: z.string().max(255).optional(),
});

export const debtorSchema = z.object({
  firstName: z
    .string()
    .min(2, "Ism kamida 2 ta belgidan iborat bo‘lishi kerak")
    .max(50, "Ism juda uzun"),
  lastName: z
    .string()
    .max(50, "Familiya juda uzun")
    .optional()
    .default(""),
  phone: z
    .string()
    .min(9, "Telefon raqami noto‘g‘ri")
    .transform((val) => normalizePhone(val))
    .refine((val) => val.length === 12 && val.startsWith("998"), {
      message: "Telefon raqami O‘zbekiston formati (+998...) bo‘lishi kerak",
    }),
  initialDebt: z
    .number()
    .int()
    .nonnegative("Qarz summasi manfiy bo‘lishi mumkin emas")
    .default(0),
  description: z.string().max(255).optional(),
});

export const debtPaymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: "To‘lov summasi raqam bo‘lishi kerak" })
    .int("To‘lov butun son bo‘lishi kerak")
    .positive("To‘lov summasi 0 dan katta bo‘lishi kerak"),
  description: z.string().max(255).optional(),
});

export const debtAddSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Qarz summasi raqam bo‘lishi kerak" })
    .int("Qarz butun son bo‘lishi kerak")
    .positive("Qarz summasi 0 dan katta bo‘lishi kerak"),
  description: z.string().max(255).optional(),
});

export const cashTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Tur faqat Kirim yoki Chiqim bo‘lishi mumkin" }),
  }),
  amount: z
    .number({ invalid_type_error: "Summa raqam bo‘lishi kerak" })
    .int("Summa butun son bo‘lishi kerak")
    .positive("Summa 0 dan katta bo‘lishi kerak"),
  description: z
    .string()
    .min(2, "Izoh kamida 2 ta belgidan iborat bo‘lishi kerak")
    .max(255, "Izoh juda uzun"),
});
