import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type ScreenProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  /** Acción a la derecha del título (un IconButton o Button pequeño). */
  headerAction?: React.ReactNode;
  /** Acciones fijas en el pie (CTA principal de formularios). */
  footer?: React.ReactNode;
  scroll?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Contenedor estándar de pantalla: área segura, encabezado, desplazamiento y pie fijo. */
export function Screen({ title, subtitle, onBack, headerAction, footer, scroll = true, children, className }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const body = <View className={cn('gap-4 px-4 pb-6', className)}>{children}</View>;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top + 8 }} className="gap-1 px-4 pb-3">
        {onBack ? (
          <Pressable role="button" aria-label="Volver" onPress={onBack} className="-ml-2 h-11 w-11 items-center justify-center active:opacity-70">
            <Icon name="chevron-left" size={24} />
          </Pressable>
        ) : null}
        {title ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="h1" className="flex-1">{title}</Text>
            {headerAction}
          </View>
        ) : null}
        {subtitle ? <Text variant="body-sm" className="text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>{body}</ScrollView>
      ) : (
        <View className="flex-1">{body}</View>
      )}
      {footer ? (
        <View className="border-t border-border bg-card px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
