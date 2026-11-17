import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

/**
 * React Native no hereda estilos de texto de un View: los contenedores (Button, Badge…)
 * publican sus clases de texto con este contexto y Text las consume.
 */
export const TextClassContext = React.createContext<string | undefined>(undefined);

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      balance: 'font-display-bold text-[40px] leading-[48px] tracking-[-1px]',
      display: 'font-display-bold text-[32px] leading-[40px] tracking-[-0.5px]',
      h1: 'font-display-bold text-[28px] leading-[36px] tracking-[-0.5px]',
      h2: 'font-display-semibold text-[22px] leading-[28px]',
      h3: 'font-display-semibold text-[18px] leading-[24px]',
      section: 'font-display-semibold text-[17px] leading-[24px]',
      'highlight-title': 'font-display-bold text-[19px] leading-[25px]',
      title: 'font-sans-semibold text-base leading-6',
      body: 'font-sans text-base leading-6',
      'body-sm': 'font-sans text-sm leading-5',
      label: 'font-sans-medium text-sm leading-5',
      caption: 'font-sans text-xs leading-4',
      overline: 'font-sans-semibold text-xs uppercase leading-4 tracking-[0.5px]',
    },
  },
  defaultVariants: { variant: 'body' },
});

const HEADING_LEVEL: Partial<Record<NonNullable<VariantProps<typeof textVariants>['variant']>, number>> = {
  h1: 1,
  h2: 2,
  h3: 3,
  section: 2,
};

export type TextProps = RNTextProps & VariantProps<typeof textVariants>;

export function Text({ className, variant, ...props }: TextProps) {
  const inherited = React.useContext(TextClassContext);
  const level = variant ? HEADING_LEVEL[variant] : undefined;
  return (
    <RNText
      role={level ? 'heading' : undefined}
      aria-level={level}
      className={cn(textVariants({ variant }), inherited, className)}
      {...props}
    />
  );
}
