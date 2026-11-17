import { describe, expect, it } from 'vitest';

import { daysBetween, formatDateShort, formatDMY, formatPeriod, isValidISODate, maskDMY, parseDMY, parseISODate, toISODate } from './dates';

describe('dates', () => {
  it('interpreta YYYY-MM-DD en hora local, sin correr el día', () => {
    const date = parseISODate('2026-11-17');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 17]);
    expect(toISODate(date)).toBe('2026-11-17');
  });

  it('formatea fechas y períodos en español', () => {
    expect(formatDateShort('2026-11-05')).toBe('5 nov 2026');
    expect(formatPeriod('2026-11-01')).toBe('Noviembre 2026');
    expect(formatDMY('2026-11-05')).toBe('05/11/2026');
  });

  it('valida y convierte fechas escritas como dd/mm/aaaa', () => {
    expect(parseDMY('5/11/2026')).toBe('2026-11-05');
    expect(parseDMY('31/02/2026')).toBeNull();
    expect(parseDMY('2026-11-05')).toBeNull();
    expect(isValidISODate('2026-02-30')).toBe(false);
  });

  it('cuenta días calendario entre fechas', () => {
    expect(daysBetween('2026-11-17', '2026-12-15')).toBe(28);
    expect(daysBetween('2026-11-17', '2026-11-14')).toBe(-3);
  });
});

describe('maskDMY', () => {
  it('inserta las barras mientras se escribe', () => {
    expect(maskDMY('05')).toBe('05');
    expect(maskDMY('0511')).toBe('05/11');
    expect(maskDMY('05112026')).toBe('05/11/2026');
    expect(maskDMY('05/11/2026 extra 99')).toBe('05/11/2026');
  });
});
