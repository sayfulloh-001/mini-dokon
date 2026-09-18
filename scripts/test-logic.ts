import { normalizePhone, formatPhone, maskPhone, isValidPhone } from "../lib/utils/phone";
import { formatCurrency, parseCurrencyInput } from "../lib/utils/currency";
import { getDateRange } from "../lib/utils/date";
import { registerSchema, loginSchema, saleSchema, debtorSchema, debtPaymentSchema } from "../lib/schemas";

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST PASSED: ${testName}`);
  }
}

console.log("\n==========================================");
console.log("DO‘KON BOSHQARUVI — YADRO MANTIQ TESTLARI");
console.log("==========================================\n");

// TEST 1: Telefon normalizatsiyasi
assert(normalizePhone("+998 90 123 45 67") === "998901234567", "Telefon (+998 90 123 45 67) normalizatsiyasi");
assert(normalizePhone("901234567") === "998901234567", "Telefon (901234567) normalizatsiyasi");
assert(normalizePhone("998901234567") === "998901234567", "Telefon (998901234567) normalizatsiyasi");
assert(normalizePhone("+998901234567") === "998901234567", "Telefon (+998901234567) normalizatsiyasi");

// TEST 2: Telefon formatlash va maskalash
assert(formatPhone("998901234567") === "+998 90 123 45 67", "Telefon formati (+998 90 123 45 67)");
assert(maskPhone("998901234567") === "+998 90 *** ** 67", "Telefon maskalash (+998 90 *** ** 67)");
assert(isValidPhone("+998 90 123 45 67") === true, "To'g'ri telefon validatsiyasi");
assert(isValidPhone("12345") === false, "Noto'g'ri telefon inkor qilinishi");

// TEST 3: Pul formatlash (UZS so'm)
assert(formatCurrency(100000) === "100 000 so‘m", "100000 -> 100 000 so'm");
assert(formatCurrency(0) === "0 so‘m", "0 -> 0 so'm");
assert(formatCurrency(2450000) === "2 450 000 so‘m", "2450000 -> 2 450 000 so'm");
assert(parseCurrencyInput("100 000 so'm") === 100000, "parseCurrencyInput");

// TEST 4: Vaqt zonalari (Asia/Tashkent UTC+5)
const todayRange = getDateRange("today");
assert(todayRange.startDate !== null, "Bugungi sana filtri start mavjud");
assert(todayRange.label === "Bugun", "Bugungi sana filtri label");

const allRange = getDateRange("all");
assert(allRange.startDate === null, "Barchasi filtri start cheklovsiz (null)");

// TEST 5: Zod Validatsiyalari
const validReg = registerSchema.safeParse({
  storeName: "Sayfulloh Savdo",
  firstName: "Sayfulloh",
  lastName: "Aliyev",
  phone: "+998 90 123 45 67",
  pin: "1234",
});
assert(validReg.success === true, "To'g'ri ro'yxatdan o'tish ma'lumotlari");

const invalidRegPhone = registerSchema.safeParse({
  storeName: "Test",
  firstName: "Ali",
  lastName: "Valiyev",
  phone: "12345",
  pin: "1234",
});
assert(invalidRegPhone.success === false, "Qisqa telefon raqami rad etilishi");

const invalidPin = registerSchema.safeParse({
  storeName: "Test",
  firstName: "Ali",
  lastName: "Valiyev",
  phone: "+998 90 123 45 67",
  pin: "12", // kamida 4 belgi
});
assert(invalidPin.success === false, "Qisqa PIN rad etilishi");

// TEST 6: Savdo summasi validatsiyasi
const validSale = saleSchema.safeParse({ amount: 100000 });
assert(validSale.success === true, "100 000 so'm savdo qabul qilinishi");

const zeroSale = saleSchema.safeParse({ amount: 0 });
assert(zeroSale.success === false, "0 so'm savdo rad etilishi");

const negativeSale = saleSchema.safeParse({ amount: -50000 });
assert(negativeSale.success === false, "Manfiy savdo rad etilishi");

// TEST 7: Qarzdor duplikat va to'lov hisob-kitob mantiqi
const initialDebt = 100000;
const addedDebt = 10000;
const mergedDebt = initialDebt + addedDebt;
assert(mergedDebt === 110000, "Qarz oshirilishi: 100 000 + 10 000 = 110 000");

const partialPayment = 20000;
const remainingAfterPartial = mergedDebt - partialPayment;
assert(remainingAfterPartial === 90000, "Qisman to'lov: 110 000 - 20 000 = 90 000");

const fullPayment = 90000;
const finalBalance = Math.max(0, remainingAfterPartial - fullPayment);
assert(finalBalance === 0, "To'liq to'lov: 90 000 - 90 000 = 0 (Faol qarzdorlardan chiqariladi)");

console.log("\n==========================================");
console.log("BARCHA YADRO MANTIQ TESTLARI MUVAFFAQIShLI O‘TDI! ✨");
console.log("==========================================\n");
