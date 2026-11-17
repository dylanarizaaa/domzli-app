import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md web:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary active:bg-primary-emphasis web:hover:bg-primary-emphasis',
        secondary: 'bg-secondary active:bg-muted',
        outline: 'border border-input bg-card active:bg-muted',
        ghost: 'active:bg-muted',
        destructive: 'bg-destructive active:opacity-90',
        link: '',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-[52px] px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export const buttonTextVariants = cva('font-sans-medium text-base', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
      link: 'text-primary underline',
    },
    size: { sm: 'text-sm', md: '', lg: '', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

export type ButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
    loading?: boolean;
    iconStart?: IconName;
    iconEnd?: IconName;
    className?: string;
  };

const SPINNER_ON_PRIMARY = new Set(['default', 'destructive']);

export function Button({
  className, variant, size, loading = false, disabled, iconStart, iconEnd, children, ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const textClass = buttonTextVariants({ variant, size });
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <TextClassContext.Provider value={textClass}>
      <Pressable
        role="button"
        aria-disabled={isDisabled}
        aria-busy={loading}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), isDisabled && 'opacity-50', className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={SPINNER_ON_PRIMARY.has(variant ?? 'default') ? '#ffffff' : undefined} />
        ) : iconStart ? (
          <Icon name={iconStart} size={iconSize} className={textClass} />
        ) : null}
        {typeof children === 'string' ? <Text>{children}</Text> : children}
        {iconEnd ? <Icon name={iconEnd} size={iconSize} className={textClass} /> : null}
      </Pressable>
    </TextClassContext.Provider>
  );
}
