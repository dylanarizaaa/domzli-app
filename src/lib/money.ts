/**
 * Dinero en el cliente (ADR-0008): los montos se manejan como centavos enteros.
 * La base de datos es la única autoridad para saldos; aquí solo se suma y se formatea.
 */

/** Convierte un `numeric(14,2)` recibido de la API (número o cadena) a centavos enteros. */
export function toCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Centavos enteros → número decimal para enviar a la API. */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function groupThousands(integer: number): string {
  return String(Math.abs(integer)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "$ 1.250.000": pesos sin decimales, punto de miles (es-CO). Determinista en todas las plataformas. */
export function formatCOP(cents: number): string {
  const pesos = Math.round(cents / 100);
  return `${pesos < 0 ? '− ' : ''}$ ${groupThousands(pesos)}`;
}

/** "$ 1,3 M" para tablas y gráficos; por debajo del millón usa el formato completo. */
export function formatCOPCompact(cents: number): string {
  const pesos = cents / 100;
  if (Math.abs(pesos) < 1_000_000) return formatCOP(cents);
  const millions = Math.round(pesos / 100_000) / 10;
  return `$ ${String(millions).replace('.', ',')} M`;
}

/** Lectura para lectores de pantalla: "1.250.000 pesos". */
export function spokenCOP(cents: number): string {
  return `${groupThousands(Math.round(cents / 100))} pesos`;
}

/** Dígitos de un campo de monto ("$ 1.250.000", "1250000") → pesos enteros como cadena. */
export function parsePesosInput(text: string): string {
  return text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
}

/** Pesos enteros como cadena → texto con puntos de miles para mostrar en el campo. */
export function formatPesosInput(digits: string): string {
  return digits ? groupThousands(Number(digits)) : '';
}
