/**
 * Fechas de negocio (TAD §6.4): viajan como 'YYYY-MM-DD' y se interpretan en hora local.
 * Nunca usar `new Date('YYYY-MM-DD')`: lo interpreta en UTC y en Colombia muestra el día anterior.
 */

export type ISODate = string;

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISODate(parseISODate(iso)) === iso;
}

/** "17 nov 2026" */
export function formatDateShort(iso: ISODate): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Noviembre 2026" */
export function formatPeriod(iso: ISODate): string {
  const date = parseISODate(iso);
  const month = MONTHS_LONG[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

/** Nombre del mes en minúscula: "noviembre". */
export function monthName(iso: ISODate): string {
  return MONTHS_LONG[parseISODate(iso).getMonth()];
}

/** Días calendario entre dos fechas (b − a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** "dd/mm/aaaa" → 'YYYY-MM-DD', o null si no es una fecha válida. */
export function parseDMY(text: string): ISODate | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return isValidISODate(iso) ? iso : null;
}

/** 'YYYY-MM-DD' → "dd/mm/aaaa" */
export function formatDMY(iso: ISODate): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
