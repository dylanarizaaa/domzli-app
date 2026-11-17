import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

const badgeVariants = cva('flex-row items-center gap-1 self-start rounded-sm px-2', {
  variants: {
    tone: {
      neutral: 'bg-muted',
      info: 'bg-info-subtle',
      success: 'bg-success-subtle',
      warning: 'bg-warning-subtle',
      danger: 'bg-danger-subtle',
      outline: 'border border-border',
    },
    size: { sm: 'h-5 px-1.5', md: 'h-6' },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

const badgeTextVariants = cva('font-sans-medium', {
  variants: {
    tone: {
      neutral: 'text-foreground',
      info: 'text-info-subtle-foreground',
      success: 'text-success-subtle-foreground',
      warning: 'text-warning-subtle-foreground',
      danger: 'text-danger-subtle-foreground',
      outline: 'text-foreground',
    },
    size: { sm: 'text-xs leading-4', md: 'text-sm leading-5' },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  /** El texto es obligatorio: un badge nunca comunica solo con color. */
  children: string;
  icon?: IconName;
  className?: string;
};

export function Badge({ tone, size, icon, children, className }: BadgeProps) {
  const textClass = badgeTextVariants({ tone, size });
  return (
    <View className={cn(badgeVariants({ tone, size }), className)}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 12 : 16} className={textClass} /> : null}
      <Text className={textClass}>{children}</Text>
    </View>
  );
}
