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
import { colors, radius, shadows, spacing, typography } from '../theme';

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type BtnSize = 'sm' | 'md' | 'lg';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  style,
  icon,
  iconPosition = 'left',
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  size?: BtnSize;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
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
    variant === 'outline'
      ? colors.green
      : variant === 'ghost'
      ? colors.textMuted
      : colors.white;
  const borderColor =
    variant === 'outline' ? colors.green : variant === 'ghost' ? 'transparent' : bg;
  const showLift = (variant === 'primary' || variant === 'danger' || variant === 'secondary') && !disabled;
  const heightPx = size === 'sm' ? 40 : size === 'md' ? 46 : 54;
  const fontSizePx = size === 'sm' ? 13 : size === 'md' ? 15 : 16;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        showLift ? (variant === 'secondary' ? shadows.sm : shadows.button) : null,
        {
          height: heightPx,
          backgroundColor: disabled ? '#D4D8DE' : bg,
          borderColor: disabled ? '#D4D8DE' : borderColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }, { translateY: pressed && showLift ? 1 : 0 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {iconPosition === 'left' && icon}
          <Text style={[styles.btnText, { color: fg, fontSize: fontSizePx }]}>{title}</Text>
          {iconPosition === 'right' && icon}
        </View>
      )}
    </Pressable>
  );
}

export function Card({
  style,
  children,
  elevated = true,
  tone,
  ...rest
}: ViewProps & {
  children?: React.ReactNode;
  elevated?: boolean;
  tone?: 'default' | 'success' | 'warn' | 'danger' | 'info' | 'subtle';
}) {
  const toneStyle =
    tone === 'success'
      ? { backgroundColor: colors.greenLight, borderColor: 'transparent' }
      : tone === 'warn'
      ? { backgroundColor: colors.goldLight, borderColor: 'transparent' }
      : tone === 'danger'
      ? { backgroundColor: colors.redLight, borderColor: 'transparent' }
      : tone === 'info'
      ? { backgroundColor: '#E8F0FE', borderColor: 'transparent' }
      : tone === 'subtle'
      ? { backgroundColor: colors.bgSubtle, borderColor: 'transparent' }
      : null;

  return (
    <View
      style={[
        styles.card,
        elevated ? shadows.md : { borderWidth: 1, borderColor: colors.border },
        toneStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Input({ style, ...rest }: TextInputProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textSubtle}
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
        focus && {
          borderColor: colors.green,
          backgroundColor: colors.white,
          ...shadows.xs,
        },
        style,
      ]}
    />
  );
}

export function Pill({
  label,
  tone = 'neutral',
  size = 'md',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warn' | 'info';
  size?: 'sm' | 'md';
}) {
  const colorMap: Record<string, { bg: string; fg: string }> = {
    success: { bg: colors.greenLight, fg: colors.green },
    danger: { bg: colors.redLight, fg: colors.red },
    warn: { bg: colors.goldLight, fg: '#8A5A00' },
    info: { bg: '#E8F0FE', fg: '#1A56DB' },
    neutral: { bg: colors.bgSubtle, fg: colors.textMuted },
  };
  const c = colorMap[tone];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: size === 'sm' ? 8 : 11,
        paddingVertical: size === 'sm' ? 3 : 5,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: c.fg,
          fontSize: size === 'sm' ? 11 : 12,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Screen({
  children,
  style,
  bg = colors.bgCanvas,
}: {
  children: React.ReactNode;
  style?: any;
  bg?: string;
}) {
  return <View style={[{ flex: 1, backgroundColor: bg }, style]}>{children}</View>;
}

export function H1({ children, style }: any) { return <Text style={[typography.h1, style]}>{children}</Text>; }
export function H2({ children, style }: any) { return <Text style={[typography.h2, style]}>{children}</Text>; }
export function H3({ children, style }: any) { return <Text style={[typography.h3, style]}>{children}</Text>; }
export function Body({ children, muted, style }: any) {
  return <Text style={[muted ? typography.bodyMuted : typography.body, style]}>{children}</Text>;
}
export function Caption({ children, style }: any) {
  return <Text style={[typography.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  btnText: { fontWeight: '700', letterSpacing: 0.1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 54,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    backgroundColor: colors.bgSubtle,
  },
});
