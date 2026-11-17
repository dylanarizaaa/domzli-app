// Genera src/theme/global.css y src/theme/tokens.generated.ts desde docs/design-system/tokens.json.
// Uso: npm run tokens:build · npm run tokens:check (falla si los archivos generados están desactualizados).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'docs/design-system/tokens.json'), 'utf8'));
const themes = tokens.color.themes.map((t) => t.id);
const byName = new Map(tokens.color.tokens.map((t) => [t.name, t]));

function resolveValue(name, theme, depth = 0) {
  if (depth > 16) throw new Error(`Alias circular en ${name}`);
  const token = byName.get(name);
  if (!token) throw new Error(`Token de color inexistente: ${name}`);
  const raw = typeof token.value === 'string' ? token.value : (token.value[theme] ?? token.value[themes[0]]);
  const alias = /^\{(.+)\}$/.exec(raw);
  return alias ? resolveValue(alias[1], theme, depth + 1) : raw;
}

function hexToChannels(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
}

const resolved = Object.fromEntries(
  themes.map((theme) => [theme, Object.fromEntries(tokens.color.tokens.map((t) => [t.name, resolveValue(t.name, theme)]))]),
);

const cssVar = (name) => `--color-${name}`;
const cssValue = (value) => (value.startsWith('#') ? hexToChannels(value) : value);

const lines = [
  '/* GENERADO por scripts/build-tokens.mjs desde docs/design-system/tokens.json. No editar. */',
  '@tailwind base;',
  '@tailwind components;',
  '@tailwind utilities;',
  '',
  ':root {',
  ...Object.entries(resolved[themes[0]]).map(([name, value]) => `  ${cssVar(name)}: ${cssValue(value)};`),
  '}',
];
for (const theme of themes.slice(1)) {
  const diff = Object.entries(resolved[theme]).filter(([name, value]) => value !== resolved[themes[0]][name]);
  lines.push('', `.${theme}:root {`, ...diff.map(([name, value]) => `  ${cssVar(name)}: ${cssValue(value)};`), '}');
}
const css = lines.join('\n') + '\n';

const ts = [
  '// GENERADO por scripts/build-tokens.mjs desde docs/design-system/tokens.json. No editar.',
  '// Colores resueltos para consumidores sin className (iconos, degradados, navegación).',
  `export const colors = ${JSON.stringify(resolved, null, 2)} as const;`,
  '',
  `export type ThemeName = ${themes.map((t) => `'${t}'`).join(' | ')};`,
  `export type ColorToken = keyof (typeof colors)['${themes[0]}'];`,
  '',
].join('\n');

const targets = [
  [resolve(root, 'src/theme/global.css'), css],
  [resolve(root, 'src/theme/tokens.generated.ts'), ts],
];

if (process.argv.includes('--check')) {
  const stale = targets.filter(([path, content]) => {
    try { return readFileSync(path, 'utf8') !== content; } catch { return true; }
  });
  if (stale.length) {
    console.error('Tokens desactualizados. Ejecuta: npm run tokens:build\n' + stale.map(([p]) => ' - ' + p).join('\n'));
    process.exit(1);
  }
  console.log('Tokens al día.');
} else {
  for (const [path, content] of targets) writeFileSync(path, content);
  console.log(`Tokens generados: ${tokens.color.tokens.length} colores, ${themes.length} temas.`);
}
