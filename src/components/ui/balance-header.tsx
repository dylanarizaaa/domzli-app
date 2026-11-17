import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initials } from '@/components/ui/avatar';
import { Icon, type IconName } from '@/components/ui/icon';
import { MoneyText } from '@/components/ui/money-text';
import { Text } from '@/components/ui/text';
import { colors } from '@/theme/tokens.generated';

const GRADIENTS = {
  indigo: [colors.light['hero-start'], colors.light['hero-mid'], colors.light['hero-end']],
  night: [colors.light['brand-900'], colors.light['brand-950'], colors.light['neutral-975']],
} as const;

export type BalanceHeaderProps = {
  /** Qué representa la cifra: "Canon mensual esperado". */
  label: string;
  /** Monto protagonista en centavos. Si se omite, se muestra `valueText`. */
  amountCents?: number;
  valueText?: string;
  caption?: string;
  captionIcon?: IconName;
  userName: string;
  organization?: string;
  notifications?: number;
  tone?: keyof typeof GRADIENTS;
  onAccount?: () => void;
  onNotifications?: () => void;
};

/**
 * Encabezado de color con una sola cifra protagonista (dirección Billetera).
 * Deja 72 px libres abajo para que ActionCard se monte encima.
 */
export function BalanceHeader({
  label, amountCents, valueText, caption, captionIcon, userName, organization, notifications = 0, tone = 'indigo',
  onAccount, onNotifications,
}: BalanceHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[...GRADIENTS[tone]]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 72, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 12 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          role="button"
          aria-label={`Tu cuenta, ${userName}`}
          onPress={onAccount}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-hero-border bg-hero-end active:opacity-80"
        >
          <Text className="font-sans-bold text-sm text-hero-foreground">{initials(userName) || '?'}</Text>
        </Pressable>
        {organization ? (
          <Text numberOfLines={1} className="flex-1 text-center font-sans text-[13px] leading-[18px] text-hero-muted">
            {organization}
          </Text>
        ) : <View className="flex-1" />}
        <Pressable
          role="button"
          aria-label={notifications > 0 ? `Notificaciones: ${notifications} nuevas` : 'Notificaciones'}
          onPress={onNotifications}
          className="h-11 w-11 items-center justify-center rounded-lg border-[1.5px] border-hero-border active:opacity-80"
        >
          <Icon name="bell" size={20} className="text-hero-foreground" />
          {notifications > 0 ? <View className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full bg-highlight-orange" /> : null}
        </Pressable>
      </View>

      <View className="items-center gap-1">
        <Text className="font-sans text-sm leading-5 text-hero-muted">{label}</Text>
        {amountCents !== undefined ? (
          <MoneyText variant="balance" amountCents={amountCents} className="text-hero-foreground" adjustsFontSizeToFit numberOfLines={1} />
        ) : (
          <Text variant="balance" className="text-hero-foreground" adjustsFontSizeToFit numberOfLines={1}>{valueText}</Text>
        )}
        {caption ? (
          <View className="mt-1 flex-row items-center gap-1.5 rounded-full bg-hero-chip px-3 py-[3px]">
            {captionIcon ? <Icon name={captionIcon} size={14} className="text-hero-foreground" /> : null}
            <Text className="font-sans-semibold text-xs leading-[18px] text-hero-foreground">{caption}</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}
