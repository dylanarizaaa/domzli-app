import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

const SIZES = { 24: 'h-6 w-6', 32: 'h-8 w-8', 40: 'h-10 w-10', 56: 'h-14 w-14' } as const;
const TEXT = { 24: 'text-[10px]', 32: 'text-xs', 40: 'text-sm', 56: 'text-lg' } as const;

export function Avatar({ name, size = 40, className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <View
      role="img"
      aria-label={name}
      className={cn('items-center justify-center rounded-full bg-muted', SIZES[size], className)}
    >
      <Text className={cn('font-sans-semibold text-muted-foreground', TEXT[size])}>{initials(name) || '?'}</Text>
    </View>
  );
}
