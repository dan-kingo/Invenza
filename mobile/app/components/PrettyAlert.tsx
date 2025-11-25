import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Paragraph, Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

type Action = {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'cancel' | 'destructive' | 'contained';
};

export default function PrettyAlert({
  visible,
  title,
  message,
  actions = [],
  onDismiss,
}: {
  visible: boolean;
  title?: string;
  message?: string;
  actions?: Action[];
  onDismiss: () => void;
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        {title ? <Dialog.Title>{title}</Dialog.Title> : null}
        <Dialog.Content>
          <Paragraph style={styles.message}>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          {actions.length > 0 ? (
            actions.map((a, idx) => (
              <Button
                key={idx}
                onPress={() => {
                  onDismiss();
                  a.onPress && a.onPress();
                }}
                mode={a.variant === 'contained' || a.variant === 'destructive' ? 'contained' : 'text'}
                textColor={a.variant === 'destructive' ? colors.error : undefined}
                style={a.variant === 'contained' ? styles.strongBtn : undefined}
              >
                {a.label}
              </Button>
            ))
          ) : (
            <Button onPress={onDismiss}>OK</Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    marginHorizontal: 24,
  },
  message: {
    color: colors.text,
  },
  actions: {
    paddingHorizontal: 8,
  },
  strongBtn: {
    marginLeft: 8,
  },
});
