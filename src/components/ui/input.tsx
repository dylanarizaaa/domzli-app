import * as React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens.generated';

export type InputProps = TextInputProps & {
  iconStart?: IconName;
  prefix?: string;
  invalid?: boolean;
  trailing?: React.ReactNode;
  className?: string;
};

export function Input({ iconStart, prefix, invalid, trailing, className, editable = true, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View
      className={cn(
        'h-11 flex-row items-center gap-2 rounded-md border border-input bg-card px-3',
        focused && 'border-primary',
        invalid && 'border-destructive',
        !editable && 'bg-muted opacity-60',
        className,
      )}
    >
      {iconStart ? <Icon name={iconStart} size={20} className="text-muted-foreground" /> : null}
      {prefix ? <Text className="text-muted-foreground">{prefix}</Text> : null}
      <TextInput
        className="h-full flex-1 font-sans text-base text-card-foreground web:outline-none"
        placeholderTextColor={colors.light['muted-foreground']}
        editable={editable}
        aria-invalid={invalid}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {trailing}
    </View>
  );
}
