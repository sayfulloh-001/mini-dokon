/**
 * Pul qiymatini chiroyli so'm formatiga keltiradi:
 * 100000 -> "100 000 so‘m"
 * 0 -> "0 so‘m"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0 so‘m";
  }
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${isNegative ? "-" : ""}${formatted} so‘m`;
}

/**
 * Faqat raqamlarni ajratib olish (input uchun)
 */
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
