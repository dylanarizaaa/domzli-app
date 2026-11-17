import { Input, type InputProps } from '@/components/ui/input';
import { formatPesosInput, parsePesosInput } from '@/lib/money';

export type MoneyInputProps = Omit<InputProps, 'value' | 'onChangeText' | 'prefix' | 'keyboardType'> & {
  /** Pesos enteros como cadena: "1250000". */
  value: string;
  onValueChange: (pesos: string) => void;
};

/** Campo de monto en pesos con formato en vivo ("$ 1.250.000") y teclado numérico. */
export function MoneyInput({ value, onValueChange, placeholder = '0', ...props }: MoneyInputProps) {
  return (
    <Input
      prefix="$"
      keyboardType="number-pad"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatPesosInput(value)}
      onChangeText={(text) => onValueChange(parsePesosInput(text))}
      {...props}
    />
  );
}
