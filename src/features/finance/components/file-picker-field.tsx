import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { toAppError } from '@/lib/errors';
import { pickDocument, pickImage, takePhoto, type PickedFile } from '@/services/storage';

/** Adjuntar un comprobante: cámara, galería o PDF. */
export function FilePickerField({ value, onChange, invalid }: { value: PickedFile | null; onChange: (file: PickedFile | null) => void; invalid?: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const run = async (picker: () => Promise<PickedFile | null>) => {
    setError(null);
    try {
      const file = await picker();
      if (file) onChange(file);
    } catch (e) {
      setError(toAppError(e).message);
    }
  };

  if (value) {
    return (
      <View className="flex-row items-center gap-3 rounded-md border border-input bg-card p-3">
        <Icon name={value.mimeType === 'application/pdf' ? 'file-text' : 'image'} size={24} className="text-primary" />
        <Text variant="body-sm" numberOfLines={1} className="flex-1">{value.name}</Text>
        <Pressable role="button" aria-label="Quitar archivo" onPress={() => onChange(null)} hitSlop={12} className="active:opacity-70">
          <Icon name="x" size={20} className="text-muted-foreground" />
        </Pressable>
      </View>
    );
  }
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <Button variant="outline" iconStart="camera" className={invalid ? 'flex-1 border-destructive' : 'flex-1'} onPress={() => run(takePhoto)}>Tomar foto</Button>
        <Button variant="outline" iconStart="image" className={invalid ? 'flex-1 border-destructive' : 'flex-1'} onPress={() => run(pickImage)}>Galería</Button>
      </View>
      <Button variant="ghost" iconStart="file-text" onPress={() => run(() => pickDocument())}>Elegir un PDF</Button>
      {error ? <Text variant="caption" className="text-destructive">{error}</Text> : null}
    </View>
  );
}
