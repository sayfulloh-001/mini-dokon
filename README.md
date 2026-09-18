# DO‘KON BOSHQARUVI — Full-Stack Web Application

Professional, tezkor va xavfsiz ko‘p foydalanuvchili (Multi-Tenant) do‘kon boshqaruvi tizimi.
Ushbu tizim do‘kon egalari (jumladan katta yoshdagi do‘konchilar) uchun telefon, planshet yoki kompyuter orqali bir necha soniya ichida savdo kiritish, qarzdorlarni boshqarish, qarz undirish va moliyaviy natijalarni kuzatish uchun mo‘ljallangan.

---

## 🌟 Asosiy Xususiyatlari

1. **Kam Bosish & Tezkor Savdo (HISOB):**
   - Katta raqamli narx kiritish maydoni.
   - Bitta bosish bilan tezkor qo‘shimcha tugmalar (`+10 000`, `+20 000`, `+50 000`, `+100 000`).
   - Katta **TUGATISH** tugmasi (Enter tugmasi bilan ham saqlanadi).
   - Double-click (ikki marta bosib yuborish) dan himoyalangan.
   - Kiritilgan savdolarni shu zahoti tahrirlash va o‘chirish imkoniyati.

2. **Qarzdorlar Boshqaruvi (QARZDORLAR):**
   - **Duplikatlarning oldini olish:** Bir xil telefon raqamiga yangi qarz yozilganda yangi qarzdor yaratilmaydi — mavjud qarzdor aniqlanib, balansi oshiriladi (`100 000 + 10 000 = 110 000`).
   - **Qidiruv:** Ism, familiya, to‘liq ism, to‘liq telefon raqami yoki telefonning oxirgi 4 raqami bo‘yicha tezkor debounced qidiruv.
   - **Qarz to‘lash:** Qisman to‘lov yoki bitta bosishda to‘liq to‘lash.
   - **Avtomatik saralash:** Qarz to‘liq (0 so‘m) to‘langanda u faol qarzdorlar ro‘yxatidan avtomatik chiqadi, biroq barcha to‘lovlar tarixi to‘liq saqlanib qoladi.
   - **Tarix:** Har bir qarzdorning barcha qarz olish, to‘lov qilish va tahrirlash tarixi sanasi bilan saqlanadi.

3. **Natija va Statistika (NATIJA):**
   - **Real ma'lumotlar:** Hech qanday soxta (mock) raqamlar yo‘q, barcha statistika PostgreSQL ma'lumotlar bazasidan hisoblanadi.
   - **Vaqt filtrlari:** Bugun (Asia/Tashkent UTC+5 bo‘yicha), 7 kun, Bu oy, 2 oy, 3 oy, 6 oy, 1 yil va Barchasi.
   - **Asosiy KPI kartalari:** Savdo tushumi, Chiqim, Sof natija (Kassadagi foyda), Do‘kondagi jami qarz, Faol qarzdorlar soni.
   - **Kirim va Chiqim:** Qo‘shimcha daromad va do‘kon xarajatlarini (ijara, elektr, oziq-ovqat) kiritish.
   - **Faoliyatlar oqimi:** Oxirgi savdolar, chiqimlar va qarz harakatlarining yagona xronologik lenti.

4. **Multi-Tenant & Xavfsizlik:**
   - Har bir do‘kon alohida `storeId` ga ega.
   - Bir do‘kon ma'lumotlari ikkinchi do‘konga HECH QACHON ko‘rinmaydi (IDOR himoyasi).
   - Server-side HttpOnly, SameSite, Secure Cookie sessiyalari.
   - PIN va parollar `bcryptjs` bilan xavfsiz heshlanadi.
   - Bir accountga bir vaqtning o‘zida turli telefonlar, planshetlar va kompyuterlardan kirish mumkin.

---

## 🛠 Texnologiyalar

- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS, Lucide Icons
- **Backend:** Next.js Server Actions / Route Handlers, Zod Validation, Node.js Crypto, bcryptjs
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Deployment:** Vercel, Render, Docker

---

## 🚀 O‘rnatish va Ishga Tushirish

### 1. Repozitoriyani klonlash va paketlarni o‘rnatish
```bash
npm install
```

### 2. Muhit parametrlarini sozlash (.env)
Loyihada `.env.example` fayli mavjud. Uni `.env` ga nusxalang:
```bash
cp .env.example .env
```
`.env` faylida PostgreSQL ulanish manzilini (`DATABASE_URL`) kiriting:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/dokon_db?schema=public"
SESSION_SECRET="d0k0n_b0shq4ruv1_sup3r_s3cur3_k3y_2026_xYz987!@#"
NEXT_PUBLIC_APP_NAME="DO‘KON BOSHQARUVI"
```

> **Eslatma:** PostgreSQL bazasini [Neon.tech](https://neon.tech), [Supabase](https://supabase.com) yoki [Render](https://render.com) orqali 30 soniyada bepul yaratib, tayyor `postgresql://...` URL manzilini olishingiz mumkin.

### 3. Agar lokal Docker ishlatmoqchi bo‘lsangiz:
```bash
docker compose up -d
```

### 4. Prisma ma'lumotlar bazasi jadvallarini yaratish:
```bash
npm run prisma:push
```
(yoki `npx prisma migrate dev --name init`)

### 5. Dastlabki namunaviy ma'lumotlarni yuklash (Ixtiyoriy):
```bash
npx --yes tsx prisma/seed.ts
```
Bu quyidagi do‘konni yaratadi:
- **Do‘kon:** Sayfulloh Savdo
- **Telefon:** `+998 90 123 45 67`
- **PIN:** `1234`

### 6. Loyihani ishga tushirish:
```bash
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.

---

## 🧪 Yadro Mantiq Testlarini Ishga Tushirish
Barcha biznes mantiq (telefon normalizatsiyasi, UZS formati, qarz hisoblash, qisman/to‘liq to‘lovlar, Zod validatsiyalari) sinovini yurgizish uchun:
```bash
npx --yes tsx scripts/test-logic.ts
```

---

## 🚢 Production Build va Deployment

### Production Build:
```bash
npm run build
npm run start
```

### Vercel'ga Joylash (Deployment):
1. Repozitoriyani GitHub'ga yuklang.
2. Vercel dashboardiga kiring va loyihani import qiling.
3. Environment Variables bo‘limiga `DATABASE_URL` (Neon / Supabase Postgres) va `SESSION_SECRET` ni kiriting.
4. **Deploy** tugmasini bosing. Build avtomatik tarzda `prisma generate && next build` buyrug‘ini bajaradi.

### Render'ga Joylash:
1. Render.com da yangi **Web Service** yarating.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Environment Variables ga `DATABASE_URL` va `SESSION_SECRET` ni qo‘shing.

---

## 🔒 Xavfsizlik Qoidalari

- Hech qachon mijoz tomonidan yuborilgan `storeId` ga ishonilmaydi. Har bir so‘rovda do‘kon identifikatori serverda saqlangan shifrlangan/imzolangan HttpOnly cookie sessiyasidan olinadi.
- Barcha pul miqdorlari (UZS) `Int` (butun son) ko‘rinishida saqlanadi, bu esa suzuvchi nuqta (floating-point) hisob-kitoblaridagi xatoliklarni 100% bartaraf etadi.
- Bir vaqtda kelgan tranzaksiyalarda balans buzilmasligi uchun Prisma `$transaction` ishlatilgan.
