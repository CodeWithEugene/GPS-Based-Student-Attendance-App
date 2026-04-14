import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button } from '../../src/components/UI';
import { colors, radius, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, Session } from '../../src/data/types';
import { isInsideGeofence } from '../../src/lib/geo';
import { useAuth } from '../../src/store';

export default function SignAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permErr, setPermErr] = useState(false);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

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
      } catch {
        // non-fatal — button will either succeed or surface error on submit
      }
    })();
  }, [session, user]);

  // Location watcher — re-subscribe every time we re-focus the screen
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
          loc => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
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
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="time-outline" size={64} color={colors.gold} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>No open session right now</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
            You'll see a notification the moment a lecturer opens one.
          </Body>
          <Button title="Back to Dashboard" variant="outline" style={{ marginTop: 20 }} onPress={() => router.push('/(student)/dashboard')} />
        </View>
      </View>
    );
  }

  const sessionOver = Date.now() > new Date(session.endsAt).getTime() || session.status !== 'live';
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
      // Re-check the session is still live before committing
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
        coords,
        status: 'present',
      };
      await repo.logAttendance(rec);
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
    : inside
      ? 'You are inside the classroom — ready to sign'
      : `You are outside — move closer${distance != null ? ` (${distance}m away)` : ''}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Sign attendance" centered />

      <View style={{ height: 280 }}>
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
            fillColor="rgba(27,94,32,0.15)"
          />
          <Marker coordinate={{ latitude: session.geofence.latitude, longitude: session.geofence.longitude }} pinColor={colors.green} />
        </MapView>
      </View>

      <View style={{ padding: spacing.lg, gap: 12, paddingBottom: spacing.lg + Math.max(insets.bottom, 12) + 8 }}>
        <View style={[styles.status, { backgroundColor: inside ? colors.greenLight : colors.redLight }]}>
          <Ionicons name={inside ? 'checkmark-circle' : 'warning'} size={22} color={inside ? colors.green : colors.red} />
          <Text style={{ color: inside ? colors.green : colors.red, fontWeight: '700', flex: 1 }}>
            {statusLabel}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{session.unitName}</Text>
            <Body muted>{session.unitCode} • {session.room}</Body>
          </View>
          <Body muted>{session.geofence.radius}m geofence</Body>
        </View>

        {sessionOver && (
          <View style={[styles.status, { backgroundColor: colors.redLight }]}>
            <Ionicons name="time-outline" size={22} color={colors.red} />
            <Text style={{ color: colors.red, fontWeight: '700', flex: 1 }}>
              This session has already ended.
            </Text>
          </View>
        )}

        <Button
          title={alreadySigned ? 'Already signed' : sessionOver ? 'Session closed' : 'Sign Attendance'}
          disabled={!inside || alreadySigned || sessionOver}
          loading={signing}
          variant="secondary"
          onPress={sign}
        />
        {!inside && coords && !sessionOver && (
          <Pressable onPress={() => router.push('/(student)/help-fail')}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Having trouble?</Text>
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
          This app cannot verify that you are inside the classroom without your location.
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
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
