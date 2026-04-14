import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  icon?: React.ReactNode;
}) {
  const bg =
    variant === 'primary'
      ? colors.red
      : variant === 'secondary'
      ? colors.green
      : variant === 'danger'
      ? colors.red
      : 'transparent';
  const fg =
    variant === 'outline' || variant === 'ghost'
      ? variant === 'ghost'
        ? colors.textMuted
        : colors.green
      : colors.white;
  const borderColor =
    variant === 'outline' ? colors.green : variant === 'ghost' ? 'transparent' : bg;
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: disabled ? '#C7CCD1' : bg,
          borderColor: disabled ? '#C7CCD1' : borderColor,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ style, children, ...rest }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Input({ style, ...rest }: TextInputProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...rest}
      onFocus={e => {
        setFocus(true);
        rest.onFocus?.(e);
      }}
      onBlur={e => {
        setFocus(false);
        rest.onBlur?.(e);
      }}
      style={[
        styles.input,
        { borderColor: focus ? colors.green : colors.border },
        style,
      ]}
    />
  );
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warn' | 'info';
}) {
  const bg =
    tone === 'success'
      ? colors.greenLight
      : tone === 'danger'
      ? colors.redLight
      : tone === 'warn'
      ? colors.goldLight
      : tone === 'info'
      ? '#E8F0FE'
      : '#EEE';
  const fg =
    tone === 'success'
      ? colors.green
      : tone === 'danger'
      ? colors.red
      : tone === 'warn'
      ? '#8A5A00'
      : tone === 'info'
      ? '#1A56DB'
      : colors.textMuted;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function Screen({
  children,
  style,
  bg = colors.white,
}: {
  children: React.ReactNode;
  style?: any;
  bg?: string;
}) {
  return <View style={[{ flex: 1, backgroundColor: bg }, style]}>{children}</View>;
}

export function H1({ children }: any) { return <Text style={typography.h1}>{children}</Text>; }
export function H2({ children }: any) { return <Text style={typography.h2}>{children}</Text>; }
export function H3({ children }: any) { return <Text style={typography.h3}>{children}</Text>; }
export function Body({ children, muted, style }: any) {
  return <Text style={[muted ? typography.bodyMuted : typography.body, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  btnText: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
});
