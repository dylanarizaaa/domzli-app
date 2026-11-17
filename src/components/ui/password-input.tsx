import * as React from 'react';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input, type InputProps } from '@/components/ui/input';

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordInput(props: Omit<InputProps, 'secureTextEntry' | 'trailing'>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <Input
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          role="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setVisible((v) => !v)}
          hitSlop={12}
          className="active:opacity-70"
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} className="text-muted-foreground" />
        </Pressable>
      }
      {...props}
    />
  );
}
