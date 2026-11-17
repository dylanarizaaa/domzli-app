const tokens = require('./docs/design-system/tokens.json');

// Cada token de color se expone como clase (bg-primary, text-muted-foreground…).
// Los valores viven en variables CSS generadas por scripts/build-tokens.mjs.
const firstTheme = tokens.color.themes[0].id;
const isTranslucent = (token) => {
  const value = typeof token.value === 'string' ? token.value : token.value[firstTheme];
  return value.startsWith('rgba');
};
const colors = Object.fromEntries(
  tokens.color.tokens.map((token) => [
    token.name,
    isTranslucent(token) ? `var(--color-${token.name})` : `rgb(var(--color-${token.name}) / <alpha-value>)`,
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px', '3xl': '24px', '4xl': '32px' },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        'display-semibold': ['Sora_600SemiBold'],
        'display-bold': ['Sora_700Bold'],
      },
    },
  },
};
