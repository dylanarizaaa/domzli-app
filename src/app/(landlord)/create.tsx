import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

type Option = { key: string; label: string; description: string; icon: IconName; href?: '/properties/new' | '/tenants/new' };

const OPTIONS: Option[] = [
  { key: 'property', label: 'Inmueble', description: 'Registra un inmueble para arrendar.', icon: 'building-2', href: '/properties/new' },
  { key: 'tenant', label: 'Inquilino', description: 'Guarda los datos de un inquilino.', icon: 'user-plus', href: '/tenants/new' },
  { key: 'lease', label: 'Contrato', description: 'Próximamente: une un inmueble con su inquilino.', icon: 'file-pen' },
  { key: 'payment', label: 'Pago', description: 'Próximamente: registra un pago recibido.', icon: 'receipt' },
];

/** Hoja del botón central "Crear". */
export default function CreateScreen() {
  const router = useRouter();
  return (
    <Screen title="Crear" onBack={() => router.back()}>
      <View className="gap-3">
        {OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            role="button"
            aria-disabled={!option.href}
            disabled={!option.href}
            onPress={() => option.href && router.replace(option.href)}
            className={`flex-row items-center gap-3 rounded-lg border border-border bg-card p-4 active:bg-muted ${option.href ? '' : 'opacity-50'}`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
              <Icon name={option.icon} size={22} className="text-accent-foreground" />
            </View>
            <View className="flex-1">
              <Text variant="title">{option.label}</Text>
              <Text variant="body-sm" className="text-muted-foreground">{option.description}</Text>
            </View>
            {option.href ? <Icon name="chevron-right" size={20} className="text-muted-foreground" /> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
