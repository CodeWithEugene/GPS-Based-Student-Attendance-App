import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Card } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, Session } from '../../src/data/types';
import { isInsideGeofence } from '../../src/lib/geo';
import { useAuth } from '../../src/store';

type Coords = { latitude: number; longitude: number; accuracy?: number };

export default function SignAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permErr, setPermErr] = useState(false);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const load = useCallback(async () => {
    if (!user) return;
    setFetchError('');
    setLoading(true);
    try {
      if (params.sessionId) {
        const all = await repo.getSessions();
        const s = all.find(x => x.id === params.sessionId) ?? null;
        setSession(s);
      } else {
        const live = await repo.getLiveSessionsForStudent(user.id);
        setSession(live[0] ?? null);
      }
    } catch (e: any) {
      setFetchError(e?.message ?? 'Could not load session.');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [params.sessionId, user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    (async () => {
      if (!session || !user) return;
      try {
        const records = await repo.getAttendanceForSession(session.id);
        setAlreadySigned(records.some(r => r.studentId === user.id));
      } catch {}
    })();
  }, [session, user]);

  useFocusEffect(
    useCallback(() => {
      let sub: Location.LocationSubscription | null = null;
      let cancelled = false;
      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'denied') {
          if (!cancelled) setPermErr(true);
          return;
        }
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== 'granted') {
            if (!cancelled) setPermErr(true);
            return;
          }
        }
        if (cancelled) return;
        setPermErr(false);
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 2000 },
          loc => setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
          }),
        );
      })();
      return () => { cancelled = true; sub?.remove(); };
    }, []),
  );

  if (permErr) return <PermDenied onBack={() => router.back()} />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <GreenHeader title="Sign attendance" centered />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.green} />
          <Body muted style={{ marginTop: 10 }}>Loading session…</Body>
        </View>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <GreenHeader title="Sign attendance" centered />
        <View style={[styles.centerBox, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Ionicons name="cloud-offline-outline" size={72} color={colors.red} />
          <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 12, color: colors.red }}>Couldn't load</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 4 }}>{fetchError}</Body>
          <Button title="Retry" variant="secondary" onPress={load} style={{ marginTop: 16, minWidth: 200 }} />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <GreenHeader title="Sign attendance" centered />
        <View style={[styles.centerBox, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={60} color={colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>No open session right now</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
            You'll be able to sign as soon as your lecturer opens one.
          </Body>
          <Button title="Back to Dashboard" variant="outline" style={{ marginTop: 20 }} onPress={() => router.push('/(student)/dashboard')} />
        </View>
      </View>
    );
  }

  const sessionOver = Date.now() > new Date(session.endsAt).getTime() || session.status !== 'live';
  const accuracyBad = coords?.accuracy != null && coords.accuracy > Math.max(session.geofence.radius, 25);
  const inside = coords ? isInsideGeofence(coords, session.geofence, session.geofence.radius) : false;
  const distance = coords
    ? Math.round(
        Math.hypot(
          (coords.latitude - session.geofence.latitude) * 111139,
          (coords.longitude - session.geofence.longitude) * 111139 * Math.cos((coords.latitude * Math.PI) / 180),
        ),
      )
    : null;

  const sign = async () => {
    if (!user || !coords || !session || alreadySigned) return;
    setSigning(true);
    try {
      const fresh = (await repo.getSessions()).find(x => x.id === session.id);
      if (!fresh || fresh.status !== 'live' || Date.now() > new Date(fresh.endsAt).getTime()) {
        router.replace({
          pathname: '/(student)/confirm',
          params: { ok: '0', unit: session.unitName, reason: 'This session has already ended.' },
        });
        return;
      }
      if (!isInsideGeofence(coords, fresh.geofence, fresh.geofence.radius)) {
        router.replace({
          pathname: '/(student)/confirm',
          params: { ok: '0', unit: session.unitName, reason: 'You moved out of the classroom area.' },
        });
        return;
      }
      const rec: AttendanceRecord = {
        id: `A-${Date.now()}`,
        sessionId: session.id,
        unitId: session.unitId,
        unitCode: session.unitCode,
        studentId: user.id,
        studentName: user.name,
        signedAt: new Date().toISOString(),
        coords: { latitude: coords.latitude, longitude: coords.longitude },
        status: 'present',
      };
      await repo.logAttendance(rec);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      router.replace({
        pathname: '/(student)/confirm',
        params: {
          ok: '1',
          unit: session.unitName,
          code: session.unitCode,
          lat: String(coords.latitude),
          lng: String(coords.longitude),
          at: rec.signedAt,
        },
      });
    } catch (e: any) {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
      router.replace({
        pathname: '/(student)/confirm',
        params: { ok: '0', unit: session.unitName, reason: e?.message ?? 'Unknown error' },
      });
    } finally {
      setSigning(false);
    }
  };

  const statusLabel = !coords
    ? 'Locating you…'
    : accuracyBad
      ? `Signal is weak (±${Math.round(coords.accuracy!)}m) — step near a window`
      : inside
        ? "You're inside the classroom — ready to sign"
        : `Outside the zone${distance != null ? ` · ${distance}m away` : ''}`;
  const tone: 'success' | 'danger' | 'warn' = !coords
    ? 'warn'
    : accuracyBad
      ? 'warn'
      : inside
        ? 'success'
        : 'danger';
  const toneColor = tone === 'success' ? colors.green : tone === 'warn' ? '#8A5A00' : colors.red;
  const toneBg = tone === 'success' ? colors.greenLight : tone === 'warn' ? colors.goldLight : colors.redLight;

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Sign attendance" centered compact />

      <View style={[styles.mapWrap, shadows.md]}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: session.geofence.latitude,
            longitude: session.geofence.longitude,
            latitudeDelta: 0.003,
            longitudeDelta: 0.003,
          }}
          showsUserLocation
        >
          <Circle
            center={{ latitude: session.geofence.latitude, longitude: session.geofence.longitude }}
            radius={session.geofence.radius}
            strokeColor={colors.green}
            strokeWidth={2}
            fillColor="rgba(27,94,32,0.14)"
          />
          <Marker coordinate={{ latitude: session.geofence.latitude, longitude: session.geofence.longitude }} pinColor={colors.green} />
        </MapView>
        {/* Floating distance chip */}
        {coords && (
          <View style={styles.mapChip}>
            <Ionicons name="navigate" size={13} color={inside ? colors.green : colors.red} />
            <Text style={[styles.mapChipText, { color: inside ? colors.green : colors.red }]}>
              {distance ?? 0}m {inside ? 'inside' : 'away'}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.bottomCard, shadows.md, { paddingBottom: spacing.lg + Math.max(insets.bottom, 12) }]}>
        <View style={[styles.status, { backgroundColor: toneBg }]}>
          <View style={styles.statusDotWrap}>
            <Animated.View
              style={[
                styles.statusPulse,
                { backgroundColor: toneColor, transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <View style={[styles.statusDot, { backgroundColor: toneColor }]} />
          </View>
          <Text style={{ color: toneColor, fontWeight: '700', flex: 1, fontSize: 14 }}>{statusLabel}</Text>
        </View>

        <Card tone="subtle" elevated={false} style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15 }}>{session.unitName}</Text>
              <Body muted style={{ fontSize: 13, marginTop: 2 }}>{session.unitCode} · {session.room}</Body>
            </View>
            <View style={styles.radiusBadge}>
              <Ionicons name="radio-outline" size={12} color={colors.green} />
              <Text style={{ color: colors.green, fontWeight: '800', fontSize: 11 }}>{session.geofence.radius}m</Text>
            </View>
          </View>
        </Card>

        {sessionOver && (
          <View style={[styles.status, { backgroundColor: colors.redLight }]}>
            <Ionicons name="time-outline" size={20} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: '700' }}>This session has ended.</Text>
          </View>
        )}

        <Button
          title={alreadySigned ? '✓ Already signed' : sessionOver ? 'Session closed' : accuracyBad ? 'Waiting for better GPS…' : 'Sign attendance'}
          disabled={!inside || alreadySigned || sessionOver || accuracyBad}
          loading={signing}
          variant="secondary"
          onPress={sign}
          icon={!alreadySigned && !sessionOver ? <Ionicons name="checkmark-circle" size={20} color="#fff" /> : undefined}
        />
        {!inside && coords && !sessionOver && (
          <Pressable onPress={() => router.push('/(student)/help-fail')}>
            <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Having trouble?</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PermDenied({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <GreenHeader title="Location needed" centered />
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location-outline" size={64} color={colors.red} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.red, marginTop: 16, textAlign: 'center' }}>Location Access Required</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
          This app cannot verify you are inside the classroom without your location.
        </Body>
        <View style={{ height: 20 }} />
        <Button title="Open Phone Settings" onPress={() => Linking.openSettings()} style={{ minWidth: 240 }} />
        <Pressable onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    margin: spacing.lg,
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgSubtle,
  },
  mapChip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  mapChipText: { fontWeight: '800', fontSize: 12 },
  bottomCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md },
  statusDotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusPulse: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  radiusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, backgroundColor: colors.greenLight,
  },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
});
