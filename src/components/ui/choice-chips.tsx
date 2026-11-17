import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type ChoiceOption<T extends string> = { value: T; label: string };

/** Selección única entre pocas opciones visibles (2 a 9), como píldoras. */
export function ChoiceChips<T extends string>({
  options, value, onValueChange, label,
}: { options: ChoiceOption<T>[]; value: T; onValueChange: (value: T) => void; label: string }) {
  return (
    <View role="radiogroup" aria-label={label} className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onValueChange(option.value)}
            className={cn('h-11 justify-center rounded-full border px-4', selected ? 'border-primary bg-accent' : 'border-input bg-card active:bg-muted')}
          >
            <Text className={cn('text-sm', selected ? 'font-sans-semibold text-accent-foreground' : 'font-sans-medium')}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
