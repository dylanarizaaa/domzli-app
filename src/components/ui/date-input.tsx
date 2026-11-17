import * as React from 'react';

import { Input, type InputProps } from '@/components/ui/input';
import { formatDMY, maskDMY, parseDMY, type ISODate } from '@/lib/dates';

export { maskDMY };

export type DateInputProps = Omit<InputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  /** Fecha como 'YYYY-MM-DD', o '' si está vacía o incompleta. */
  value: ISODate | '';
  onValueChange: (iso: ISODate | '') => void;
};

/** Campo de fecha dd/mm/aaaa. El valor siempre es una cadena ISO para evitar desfases de zona horaria. */
export function DateInput({ value, onValueChange, placeholder = 'dd/mm/aaaa', ...props }: DateInputProps) {
  const [text, setText] = React.useState(value ? formatDMY(value) : '');
  const [lastValue, setLastValue] = React.useState(value);

  // Sincroniza cambios externos (por ejemplo, valores sugeridos) sin pisar lo que se está escribiendo.
  if (value !== lastValue) {
    setLastValue(value);
    if (value && parseDMY(text) !== value) setText(formatDMY(value));
  }

  return (
    <Input
      iconStart="calendar-days"
      keyboardType="number-pad"
      inputMode="numeric"
      placeholder={placeholder}
      maxLength={10}
      value={text}
      onChangeText={(raw) => {
        const masked = maskDMY(raw);
        setText(masked);
        onValueChange(parseDMY(masked) ?? '');
      }}
      {...props}
    />
  );
}
