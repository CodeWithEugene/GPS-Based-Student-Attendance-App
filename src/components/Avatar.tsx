import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

/**
 * Circular avatar — shows photo if `uri` is set, otherwise the first initial on a soft tint.
 */
export function Avatar({
  uri,
  name = '',
  size = 44,
  ring = false,
  tone = 'green',
  style,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
  tone?: 'green' | 'light' | 'white';
  style?: ViewStyle;
}) {
  const bg = tone === 'green' ? colors.greenLight : tone === 'white' ? 'rgba(255,255,255,0.22)' : colors.bgSubtle;
  const fg = tone === 'white' ? colors.white : colors.green;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ring && {
          borderWidth: 2,
          borderColor: tone === 'white' ? 'rgba(255,255,255,0.35)' : colors.green,
        },
        styles.container,
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initial, { color: fg, fontSize: size * 0.42 }]}>
          {(name[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontWeight: '800' },
});
