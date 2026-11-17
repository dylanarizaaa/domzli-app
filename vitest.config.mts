import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Vitest cubre la lógica pura (lib y dominio). Los componentes se prueban con Jest + RNTL (ADR-0013).
export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
