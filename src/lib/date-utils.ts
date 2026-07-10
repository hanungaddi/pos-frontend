import { 
  format, 
  subMonths, 
  subDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isToday as fnsIsToday, 
  isYesterday as fnsIsYesterday,
  formatDistanceToNow as fnsFormatDistanceToNow,
  isValid as fnsIsValid
} from "date-fns";
import { id } from "date-fns/locale";

/**
 * Memastikan input tanggal valid dan mengembalikannya sebagai objek Date.
 * Mengembalikan null jika tanggal tidak valid.
 */
export function parseToDate(dateInput?: Date | string | number | null): Date | null {
  if (dateInput === null || dateInput === undefined) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return fnsIsValid(date) ? date : null;
}

/**
 * Mendapatkan range tanggal default (1 bulan yang lalu sampai hari ini).
 * Format: yyyy-MM-dd
 */
export function getDefaultDateRange() {
  const todayDate = new Date();
  const oneMonthAgo = subMonths(todayDate, 1);

  return {
    from: format(oneMonthAgo, "yyyy-MM-dd"),
    to: format(todayDate, "yyyy-MM-dd"),
  };
}

/**
 * Mengubah input tanggal menjadi string ISO-8601 di zona waktu UTC+7 (WIB).
 * Format: YYYY-MM-DDTHH:mm:ss.SSS+07:00
 */
export function toUTC7String(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    return "";
  }
  // Offset UTC+7 is +7 hours from UTC
  const utcOffset = 7 * 60 * 60 * 1000;
  const utc7Date = new Date(date.getTime() + utcOffset);
  return utc7Date.toISOString().replace(/Z$/, "+07:00");
}

/**
 * Mengembalikan objek Date hari ini (waktu saat ini).
 */
export function today(): Date {
  return new Date();
}

/**
 * Mengembalikan string tanggal hari ini dengan format yyyy-MM-dd.
 */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Memformat tanggal ke format UTC ISO String standar (YYYY-MM-DDTHH:mm:ss.SSSZ).
 */
export function formatUTC(dateInput?: Date | string | number | null): string {
  const date = parseToDate(dateInput);
  if (!date) return "";
  
  const now = new Date();
  date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  
  return date.toISOString();
}

/**
 * Memformat tanggal dengan format custom. Secara default menggunakan Bahasa Indonesia (locale: id).
 */
export function formatDate(
  dateInput?: Date | string | number | null,
  formatStr: string = "dd MMM yyyy",
  options?: { useLocale?: boolean }
): string {
  const date = parseToDate(dateInput);
  if (!date) return "";
  
  return format(date, formatStr, {
    locale: options?.useLocale === false ? undefined : id,
  });
}

/**
 * Format ke tanggal lengkap yang mudah dibaca (Bahasa Indonesia).
 * Contoh: 06 Juli 2026
 */
export function formatToReadableDate(dateInput?: Date | string | number | null): string {
  return formatDate(dateInput, "dd MMMM yyyy");
}

/**
 * Format ke tanggal & waktu lengkap yang mudah dibaca (Bahasa Indonesia).
 * Contoh: 06 Juli 2026, 08:44
 */
export function formatToReadableDateTime(dateInput?: Date | string | number | null): string {
  return formatDate(dateInput, "dd MMMM yyyy, HH:mm");
}

/**
 * Format ke waktu saja.
 * Contoh: 08:44 atau dengan detik: 08:44:05
 */
export function formatToTime(dateInput?: Date | string | number | null, includeSeconds = false): string {
  return formatDate(dateInput, includeSeconds ? "HH:mm:ss" : "HH:mm");
}

/**
 * Format ke format ISO sederhana (yyyy-MM-dd) untuk input/filter form.
 * Contoh: 2026-07-06
 */
export function formatToISO(dateInput?: Date | string | number | null): string {
  return formatDate(dateInput, "yyyy-MM-dd", { useLocale: false });
}

/**
 * Memformat jarak waktu relatif ke Bahasa Indonesia.
 * Contoh: "3 menit yang lalu", "2 jam yang lalu", "kemarin"
 */
export function formatRelative(dateInput?: Date | string | number | null): string {
  const date = parseToDate(dateInput);
  if (!date) return "";
  
  return fnsFormatDistanceToNow(date, {
    locale: id,
    addSuffix: true,
  });
}

/**
 * Mengecek apakah tanggal adalah hari ini.
 */
export function isToday(dateInput?: Date | string | number | null): boolean {
  const date = parseToDate(dateInput);
  return date ? fnsIsToday(date) : false;
}

/**
 * Mengecek apakah tanggal adalah kemarin.
 */
export function isYesterday(dateInput?: Date | string | number | null): boolean {
  const date = parseToDate(dateInput);
  return date ? fnsIsYesterday(date) : false;
}

/**
 * Mengubah jam tanggal ke awal hari (00:00:00.000).
 */
export function startOfDay(dateInput?: Date | string | number | null): Date {
  const date = parseToDate(dateInput) || new Date();
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Mengubah jam tanggal ke akhir hari (23:59:59.999).
 */
export function endOfDay(dateInput?: Date | string | number | null): Date {
  const date = parseToDate(dateInput) || new Date();
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Mengembalikan range tanggal hari ini (00:00 s.d 23:59) dalam format yyyy-MM-dd.
 */
export function getTodayRange() {
  const dateStr = todayStr();
  return { from: dateStr, to: dateStr };
}

/**
 * Mengembalikan range tanggal kemarin dalam format yyyy-MM-dd.
 */
export function getYesterdayRange() {
  const yesterday = subDays(new Date(), 1);
  const dateStr = format(yesterday, "yyyy-MM-dd");
  return { from: dateStr, to: dateStr };
}

/**
 * Mengembalikan range tanggal minggu ini (Senin s.d Hari ini/Minggu) dalam format yyyy-MM-dd.
 */
export function getThisWeekRange() {
  const todayDate = new Date();
  // Menggunakan Senin sebagai awal minggu (weekStartsOn: 1)
  const start = startOfWeek(todayDate, { weekStartsOn: 1 });
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(todayDate, "yyyy-MM-dd"),
  };
}

/**
 * Mengembalikan range tanggal bulan ini (Tanggal 1 s.d Hari ini) dalam format yyyy-MM-dd.
 */
export function getThisMonthRange() {
  const todayDate = new Date();
  const start = startOfMonth(todayDate);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(todayDate, "yyyy-MM-dd"),
  };
}

/**
 * Mengembalikan range tanggal tahun ini (1 Januari s.d Hari ini) dalam format yyyy-MM-dd.
 */
export function getThisYearRange() {
  const todayDate = new Date();
  const start = new Date(todayDate.getFullYear(), 0, 1);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(todayDate, "yyyy-MM-dd"),
  };
}

/**
 * Mengembalikan range tanggal bulan lalu secara penuh dalam format yyyy-MM-dd.
 */
export function getLastMonthRange() {
  const todayDate = new Date();
  const firstOfLastMonth = startOfMonth(subMonths(todayDate, 1));
  const lastOfLastMonth = endOfMonth(subMonths(todayDate, 1));
  return {
    from: format(firstOfLastMonth, "yyyy-MM-dd"),
    to: format(lastOfLastMonth, "yyyy-MM-dd"),
  };
}

/**
 * Mengembalikan range tanggal N hari terakhir (contoh: 7 hari terakhir) dalam format yyyy-MM-dd.
 */
export function getLastDaysRange(days: number) {
  const todayDate = new Date();
  const start = subDays(todayDate, days - 1);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(todayDate, "yyyy-MM-dd"),
  };
}


