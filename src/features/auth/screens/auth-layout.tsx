import * as React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

/** Marco común de las pantallas de acceso: marca arriba y formulario debajo. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}>
        <View className="gap-6 px-5">
          <View className="gap-2">
            <Text className="font-display-bold text-2xl text-primary">Domzli</Text>
            <Text variant="h1">{title}</Text>
            <Text className="text-muted-foreground">{subtitle}</Text>
          </View>
          <View className="gap-4">{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
