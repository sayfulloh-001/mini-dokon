/**
 * Telefon raqamini xalqaro standart 12 raqamli 998XXXXXXXXX ko'rinishiga keltiradi.
 * Misollar:
 *   "+998 90 123 45 67" -> "998901234567"
 *   "90 123 45 67"      -> "998901234567"
 *   "998901234567"      -> "998901234567"
 *   "901234567"         -> "998901234567"
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 9) {
    return `998${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("998")) {
    return digits;
  }

  if (digits.length > 12 && digits.startsWith("998")) {
    return digits.slice(0, 12);
  }

  return digits;
}

/**
 * Normalizatsiya qilingan 998901234567 raqamini chiroyli ko'rinishda formatlaydi:
 * +998 90 123 45 67
 */
export function formatPhone(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.length === 12 && norm.startsWith("998")) {
    const code = norm.slice(3, 5);
    const p1 = norm.slice(5, 8);
    const p2 = norm.slice(8, 10);
    const p3 = norm.slice(10, 12);
    return `+998 ${code} ${p1} ${p2} ${p3}`;
  }
  return phone;
}

/**
 * Xavfsizlik va ixchamlik uchun telefon raqamini maskalaydi:
 * +998 90 *** ** 67
 */
export function maskPhone(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.length === 12 && norm.startsWith("998")) {
    const code = norm.slice(3, 5);
    const p3 = norm.slice(10, 12);
    return `+998 ${code} *** ** ${p3}`;
  }
  return phone;
}

/**
 * Telefon raqami haqiqiy O'zbekiston raqami ekanligini tekshiradi (998 + 9 xona).
 */
export function isValidPhone(raw: string): boolean {
  const norm = normalizePhone(raw);
  return /^998[0-9]{9}$/.test(norm);
}
