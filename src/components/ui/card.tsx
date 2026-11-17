import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

/** Superficie para agrupar contenido. Sin sombra: borde `border` y radio `lg`. */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('rounded-lg border border-border bg-card', className)} {...props} />;
}
