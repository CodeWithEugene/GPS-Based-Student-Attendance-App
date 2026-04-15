import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, radius, shadows, spacing } from '../theme';

type LatLng = { latitude: number; longitude: number };

/** Read the key from either app.config extra or inlined EXPO_PUBLIC_* env. */
function getGoogleMapsApiKey(): string {
  const extra = (Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined)?.googleMapsApiKey;
  return extra || (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string) || '';
}

export function hasGoogleMapsKey() {
  return getGoogleMapsApiKey().trim().length > 0;
}

/**
 * A geofence preview that shows a real Google Map when an API key is configured,
 * and a clean labelled fallback card with "Open in Maps" otherwise.
 */
export function GeofenceMap({
  center,
  radiusMeters,
  label,
  style,
  showUserLocation,
}: {
  center: LatLng | null;
  radiusMeters: number;
  label?: string;
  style?: ViewStyle;
  showUserLocation?: boolean;
}) {
  if (!center) {
    return (
      <View style={[styles.shell, style]}>
        <View style={styles.fallback}>
          <Ionicons name="locate" size={36} color={colors.textSubtle} />
          <Text style={styles.fallbackTitle}>Waiting for location…</Text>
          <Text style={styles.fallbackSub}>Make sure GPS is on, then tap "Refresh GPS".</Text>
        </View>
      </View>
    );
  }

  const openInMaps = () => {
    const query = encodeURIComponent(`${center.latitude},${center.longitude}${label ? ' ' + label : ''}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  if (!hasGoogleMapsKey()) {
    return (
      <View style={[styles.shell, style]}>
        <View style={styles.fallback}>
          <View style={styles.pinIcon}>
            <Ionicons name="location" size={32} color={colors.green} />
          </View>
          <Text style={styles.fallbackTitle}>{label ?? 'Geofence centre pinned'}</Text>
          <Text style={styles.coords}>
            {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
          </Text>
          <Text style={styles.fallbackSub}>Radius: {radiusMeters} m</Text>
          <Pressable onPress={openInMaps} style={({ pressed }) => [styles.openBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="map" size={16} color={colors.green} />
            <Text style={styles.openBtnText}>Preview in Google Maps</Text>
          </Pressable>
          <Text style={styles.hint}>Add a Google Maps key to see the live map inside the app.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shell, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        showsUserLocation={!!showUserLocation}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
        region={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
      >
        <Circle
          center={center}
          radius={radiusMeters}
          strokeColor={colors.green}
          strokeWidth={2}
          fillColor="rgba(27,94,32,0.15)"
        />
        <Marker coordinate={center} pinColor={colors.green} title={label} />
      </MapView>
      <Pressable onPress={openInMaps} style={[styles.openChip, shadows.sm]}>
        <Ionicons name="open-outline" size={13} color={colors.green} />
        <Text style={styles.openChipText}>Open in Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
    minHeight: 200,
    ...shadows.sm,
  },
  fallback: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  pinIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  fallbackTitle: { fontWeight: '800', fontSize: 15, color: colors.text, marginTop: 2 },
  coords: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontFamily: 'monospace' as any, fontWeight: '600' },
  fallbackSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  openBtnText: { color: colors.green, fontWeight: '800', fontSize: 13 },
  hint: { fontSize: 11, color: colors.textSubtle, marginTop: 8, fontWeight: '600', textAlign: 'center' },
  openChip: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: colors.white,
  },
  openChipText: { color: colors.green, fontWeight: '800', fontSize: 12 },
});
