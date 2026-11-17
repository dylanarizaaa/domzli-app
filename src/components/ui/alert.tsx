import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const container = cva('flex-row gap-3 rounded-lg px-4 py-3', {
  variants: { tone: { info: 'bg-info-subtle', success: 'bg-success-subtle', warning: 'bg-warning-subtle', danger: 'bg-danger-subtle' } },
});
const text = cva('', {
  variants: {
    tone: {
      info: 'text-info-subtle-foreground',
      success: 'text-success-subtle-foreground',
      warning: 'text-warning-subtle-foreground',
      danger: 'text-danger-subtle-foreground',
    },
  },
});
const ICON: Record<Tone, IconName> = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-alert' };

/** Mensaje persistente dentro de la pantalla. */
export function Alert({ tone = 'info', title, children, className }: { tone?: Tone; title?: string; children?: string; className?: string }) {
  const textClass = text({ tone });
  return (
    <View role={tone === 'danger' ? 'alert' : 'status'} className={cn(container({ tone }), className)}>
      <Icon name={ICON[tone]} size={20} className={textClass} />
      <View className="flex-1 gap-0.5">
        {title ? <Text variant="label" className={cn('font-sans-semibold', textClass)}>{title}</Text> : null}
        {children ? <Text variant="body-sm" className={textClass}>{children}</Text> : null}
      </View>
    </View>
  );
}
