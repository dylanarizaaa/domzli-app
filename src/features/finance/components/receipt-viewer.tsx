import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Image, Linking, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toAppError } from '@/lib/errors';
import { isImagePath, signedUrl, type Bucket } from '@/services/storage';

/** Muestra un comprobante o documento privado mediante una URL firmada de vida corta. */
export function ReceiptViewer({ path, bucket = 'payment-receipts' }: { path: string; bucket?: Bucket }) {
  const url = useQuery({
    queryKey: ['signed-url', bucket, path],
    queryFn: () => signedUrl(bucket, path),
    staleTime: 4 * 60 * 1000, // la URL vence a los 5 minutos
  });
  if (url.isPending) return <ActivityIndicator />;
  if (url.error) return <Alert tone="danger">{toAppError(url.error).message}</Alert>;
  if (isImagePath(path)) {
    return (
      <View className="gap-2">
        <Image source={{ uri: url.data }} resizeMode="contain" accessibilityLabel="Comprobante de pago"
          className="h-80 w-full rounded-lg bg-muted" />
        <Button variant="ghost" size="sm" iconStart="eye" onPress={() => Linking.openURL(url.data)}>Ver en tamaño completo</Button>
      </View>
    );
  }
  return <Button variant="outline" iconStart="file-text" onPress={() => Linking.openURL(url.data)}>Abrir documento</Button>;
}
