import { Text, type TextProps } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { formatCOP, formatCOPCompact, spokenCOP } from '@/lib/money';

export type MoneyTextProps = Omit<TextProps, 'children'> & {
  amountCents: number;
  compact?: boolean;
  /** Monto anulado: tachado y atenuado. */
  voided?: boolean;
};

/** Muestra un monto en pesos con cifras tabulares. Nunca formatees montos a mano en una pantalla. */
export function MoneyText({ amountCents, compact, voided, className, style, ...props }: MoneyTextProps) {
  return (
    <Text
      accessibilityLabel={spokenCOP(amountCents)}
      className={cn(voided && 'text-muted-foreground line-through', className)}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      {...props}
    >
      {compact ? formatCOPCompact(amountCents) : formatCOP(amountCents)}
    </Text>
  );
}
