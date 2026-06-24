import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { Brand, EstadoColor, EstadoLabel } from '@/constants/ui';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline' | 'success';
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'danger'
      ? Brand.danger
      : variant === 'success'
        ? Brand.success
        : variant === 'outline'
          ? 'transparent'
          : Brand.primary;
  const textColor = variant === 'outline' ? Brand.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'outline' && styles.buttonOutline,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={Brand.textMuted}
      style={styles.input}
      {...props}
    />
  );
}

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const color = EstadoColor[estado] ?? Brand.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>
        {EstadoLabel[estado] ?? estado}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: Brand.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Brand.text,
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
