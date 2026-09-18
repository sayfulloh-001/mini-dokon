const MONTHS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

// O'zbekiston (Toshkent) UTC+5 soat farqi millisekundlarda
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

export function getTashkentNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + TASHKENT_OFFSET_MS);
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date;
  label: string;
}

export function getDateRange(period: string): DateRange {
  const now = new Date();
  const endDate = new Date(now);

  // Toshkent vaqti bo'yicha hisoblash
  const tashkentDate = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const year = tashkentDate.getUTCFullYear();
  const month = tashkentDate.getUTCMonth();
  const day = tashkentDate.getUTCDate();

  switch (period) {
    case "today": {
      // Bugun 00:00:00 (UTC da Toshkent soati bo'yicha)
      const startTashkent = Date.UTC(year, month, day, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Bugun",
      };
    }
    case "7days": {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: start,
        endDate,
        label: "Oxirgi 7 kun",
      };
    }
    case "this_month": {
      const startTashkent = Date.UTC(year, month, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Shu oy",
      };
    }
    case "2months": {
      const startTashkent = Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Oxirgi 2 oy",
      };
    }
    case "3months": {
      const startTashkent = Date.UTC(year, month - 2, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Oxirgi 3 oy",
      };
    }
    case "4months": {
      const startTashkent = Date.UTC(year, month - 3, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Oxirgi 4 oy",
      };
    }
    case "5months": {
      const startTashkent = Date.UTC(year, month - 4, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Oxirgi 5 oy",
      };
    }
    case "6months": {
      const startTashkent = Date.UTC(year, month - 5, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "Oxirgi 6 oy",
      };
    }
    case "1year": {
      const startTashkent = Date.UTC(year - 1, month, day, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "1 yil",
      };
    }
    case "2years": {
      const startTashkent = Date.UTC(year - 2, month, day, 0, 0, 0, 0) - TASHKENT_OFFSET_MS;
      return {
        startDate: new Date(startTashkent),
        endDate,
        label: "2 yil",
      };
    }
    case "all":
    default: {
      return {
        startDate: null,
        endDate,
        label: "Barchasi",
      };
    }
  }
}

export function formatUzbekDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  // Tashkent vaqti
  const t = new Date(d.getTime() + TASHKENT_OFFSET_MS);
  const day = t.getUTCDate();
  const monthName = MONTHS_UZ[t.getUTCMonth()];
  const hours = t.getUTCHours().toString().padStart(2, "0");
  const minutes = t.getUTCMinutes().toString().padStart(2, "0");

  return `${day}-${monthName}, ${hours}:${minutes}`;
}

export function formatUzbekDay(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const t = new Date(d.getTime() + TASHKENT_OFFSET_MS);
  const day = t.getUTCDate();
  const monthName = MONTHS_UZ[t.getUTCMonth()];
  const year = t.getUTCFullYear();

  return `${day}-${monthName}, ${year}`;
}
