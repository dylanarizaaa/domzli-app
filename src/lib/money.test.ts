import { describe, expect, it } from 'vitest';

import { formatCOP, formatCOPCompact, formatPesosInput, fromCents, parsePesosInput, spokenCOP, toCents } from './money';

describe('money', () => {
  it('convierte montos de la API a centavos enteros sin errores de punto flotante', () => {
    expect(toCents(1250000)).toBe(125000000);
    expect(toCents('1250000.50')).toBe(125000050);
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(toCents(null)).toBe(0);
    expect(toCents('abc')).toBe(0);
    expect(fromCents(125000050)).toBe(1250000.5);
  });

  it('formatea pesos colombianos con punto de miles y sin decimales', () => {
    expect(formatCOP(125000000)).toBe('$ 1.250.000');
    expect(formatCOP(0)).toBe('$ 0');
    expect(formatCOP(99950)).toBe('$ 1.000');
    expect(formatCOP(-60000000)).toBe('− $ 600.000');
  });

  it('abrevia millones con coma decimal', () => {
    expect(formatCOPCompact(132000000)).toBe('$ 1,3 M');
    expect(formatCOPCompact(200000000)).toBe('$ 2 M');
    expect(formatCOPCompact(60000000)).toBe('$ 600.000');
  });

  it('lee el monto para lectores de pantalla', () => {
    expect(spokenCOP(125000000)).toBe('1.250.000 pesos');
  });

  it('interpreta lo que se escribe o se pega en un campo de monto', () => {
    expect(parsePesosInput('$ 1.250.000')).toBe('1250000');
    expect(parsePesosInput('001250')).toBe('1250');
    expect(parsePesosInput('abc')).toBe('');
    expect(formatPesosInput('1250000')).toBe('1.250.000');
    expect(formatPesosInput('')).toBe('');
  });
});
