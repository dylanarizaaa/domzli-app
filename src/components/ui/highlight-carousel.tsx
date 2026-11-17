import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

const CARD_WIDTH = 286;
const GAP = 12;

export type HighlightTone = 'night' | 'orange' | 'aqua';

const SURFACE: Record<HighlightTone, string> = {
  night: 'bg-highlight-night',
  orange: 'bg-highlight-orange',
  aqua: 'bg-highlight-aqua',
};
const TITLE: Record<HighlightTone, string> = {
  night: 'text-highlight-night-foreground',
  orange: 'text-highlight-orange-foreground',
  aqua: 'text-highlight-aqua-foreground',
};
const SOFT: Record<HighlightTone, string> = {
  night: 'text-highlight-night-muted',
  orange: 'text-highlight-orange-foreground',
  aqua: 'text-highlight-aqua-foreground',
};

export type HighlightCardProps = {
  tone?: HighlightTone;
  eyebrow: string;
  title: string;
  meta?: string;
  onPress?: () => void;
};

/**
 * Tarjeta de color del carrusel. Asignación fija: night = pagos por revisar e información,
 * orange = cobros vencidos y urgencias, aqua = contratos por vencer. El texto siempre dice qué es.
 */
export function HighlightCard({ tone = 'night', eyebrow, title, meta, onPress }: HighlightCardProps) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      style={{ width: CARD_WIDTH, height: 156 }}
      className={cn('gap-1.5 overflow-hidden rounded-3xl p-[18px] active:opacity-90', SURFACE[tone])}
    >
      {tone === 'night' ? (
        <View
          aria-hidden
          className="absolute -bottom-3 -right-2 h-28 w-[84px] flex-row flex-wrap content-start gap-2.5 rounded-lg bg-brand-800 px-3.5 py-4"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} className={cn('h-3 w-[23px] rounded-[3px]', i === 1 || i === 4 ? 'bg-brand-300' : 'bg-brand-600')} />
          ))}
        </View>
      ) : null}
      <Text className={cn('font-sans-semibold text-xs leading-4', SOFT[tone])}>{eyebrow}</Text>
      <Text variant="highlight-title" className={cn(TITLE[tone], tone === 'night' ? 'max-w-[176px]' : 'max-w-[220px]')}>{title}</Text>
      {meta ? (
        <Text className={cn('mt-auto font-sans text-[13px] leading-[18px]', SOFT[tone], tone === 'night' ? 'max-w-[176px]' : 'max-w-[220px]')}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Carrusel horizontal: la siguiente tarjeta asoma para invitar a deslizar. */
export function HighlightCarousel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ScrollView
      horizontal
      aria-label={label}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + GAP}
      contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
    >
      {children}
    </ScrollView>
  );
}
