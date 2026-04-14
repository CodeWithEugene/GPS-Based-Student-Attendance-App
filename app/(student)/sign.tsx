import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, radius, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, Session } from '../../src/data/types';
import { isInsideGeofence } from '../../src/lib/geo';
import { useAuth } from '../../src/store';

export default function SignAttendance() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permErr, setPermErr] = useState(false);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const pickDefault = useCallback(async () => {
    if (!user) return;
    const live = await repo.getLiveSessionsForStudent(user.id);
    setSessions(live);
    if (params.sessionId) {
      const all = await repo.getSessions();
      const s = all.find(x => x.id === params.sessionId);
      if (s) setSession(s);
    } else if (live.length > 0) {
      setSession(live[0]);
    }
  }, [params.sessionId, user]);

  useEffect(() => { pickDefault(); }, [pickDefault]);

  useEffect(() => {
    (async () => {
      if (!session || !user) return;
      const records = await repo.getAttendanceForSession(session.id);
      setAlreadySigned(records.some(r => r.studentId === user.id));
    })();
  }, [session, user]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermErr(true);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 2000 },
        loc => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  if (permErr) return <PermDenied onOpen={() => Location.requestForegroundPermissionsAsync()} onBack={() => router.back()} />;

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
        <View style={styles.hdr}><Text style={styles.hdrTitle}>Sign Attendance</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="time-outline" size={64} color={colors.gold} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>No open session right now</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
            You'll see a notification the moment a lecturer opens one.
          </Body>
          <Button title="Back to Dashboard" variant="outline" style={{ marginTop: 20 }} onPress={() => router.push('/(student)/dashboard')} />
        </View>
      </SafeAreaView>
    );
  }

  const inside = coords ? isInsideGeofence(coords, session.geofence, session.geofence.radius) : false;
  const distance = coords ? Math.round(Math.hypot((coords.latitude - session.geofence.latitude) * 111139, (coords.longitude - session.geofence.longitude) * 111139 * Math.cos((coords.latitude * Math.PI) / 180))) : null;

  const sign = async () => {
    if (!user || !coords || !session || alreadySigned) return;
    setSigning(true);
    try {
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
      router.replace({ pathname: '/(student)/confirm', params: { ok: '1', unit: session.unitName, code: session.unitCode, lat: String(coords.latitude), lng: String(coords.longitude), at: rec.signedAt } });
    } catch (e: any) {
      router.replace({ pathname: '/(student)/confirm', params: { ok: '0', unit: session.unitName, reason: e?.message ?? 'Unknown error' } });
    } finally {
      setSigning(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={styles.hdr}><Text style={styles.hdrTitle}>Sign Attendance</Text></View>

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

      <View style={{ padding: spacing.lg, gap: 12 }}>
        <View style={[styles.status, { backgroundColor: inside ? colors.greenLight : colors.redLight }]}>
          <Ionicons name={inside ? 'checkmark-circle' : 'warning'} size={22} color={inside ? colors.green : colors.red} />
          <Text style={{ color: inside ? colors.green : colors.red, fontWeight: '700', flex: 1 }}>
            {coords
              ? inside
                ? 'You are inside the classroom — ready to sign'
                : `You are outside — move closer${distance != null ? ` (${distance}m away)` : ''}`
              : 'Locating you…'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{session.unitName}</Text>
            <Body muted>{session.unitCode} • {session.room}</Body>
          </View>
          <Body muted>{session.geofence.radius}m geofence</Body>
        </View>

        <Button
          title={alreadySigned ? 'Already signed' : 'Sign Attendance'}
          disabled={!inside || alreadySigned}
          loading={signing}
          variant="secondary"
          onPress={sign}
        />
        {!inside && coords && (
          <Pressable onPress={() => router.push('/(student)/help-fail')}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Having trouble?</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function PermDenied({ onOpen, onBack }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location-outline" size={64} color={colors.red} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.red, marginTop: 16, textAlign: 'center' }}>Location Access Required</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
          AttendEase cannot verify that you are inside the classroom without your location.
        </Body>
        <View style={{ height: 20 }} />
        <Button title="Open Phone Settings" onPress={onOpen} style={{ minWidth: 240 }} />
        <Pressable onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hdr: { backgroundColor: colors.green, padding: 14, alignItems: 'center' },
  hdrTitle: { color: '#fff', fontWeight: '700', fontSize: 17 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md },
});
