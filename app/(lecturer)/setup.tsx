import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import Slider from '@react-native-community/slider';
import { Body, Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { ClassUnit, Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function Setup() {
  const router = useRouter();
  const { user } = useAuth();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const [unit, setUnit] = useState<ClassUnit | null>(null);
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(30);
  const [duration, setDuration] = useState(30);
  const [selfie, setSelfie] = useState(false);
  const [notify, setNotify] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      const units = await repo.getUnits();
      const u = units.find(x => x.id === unitId) || null;
      setUnit(u);
      if (u) setRadius(u.geofence.radius);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setCenter({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
          if (u) setCenter({ latitude: u.geofence.latitude, longitude: u.geofence.longitude });
        }
      } else if (u) {
        setCenter({ latitude: u.geofence.latitude, longitude: u.geofence.longitude });
      }
    })();
  }, [unitId]);

  const start = async () => {
    if (!unit || !center || !user) return;
    setStarting(true);
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60_000);
    const s: Session = {
      id: `SES-${Date.now()}`,
      unitId: unit.id,
      unitCode: unit.code,
      unitName: unit.name,
      room: unit.room,
      lecturerId: user.id,
      startedAt: now.toISOString(),
      endsAt: end.toISOString(),
      geofence: { ...center, radius },
      requireSelfie: selfie,
      status: 'live',
    };
    await repo.createSession(s);
    router.replace('/(lecturer)/active');
  };

  if (!unit) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Set Up Session" tone="green" back />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14 }}>
        <Text style={{ fontWeight: '600' }}>Unit name</Text>
        <Input value={unit.name} editable={false} style={{ backgroundColor: colors.bgSubtle }} />
        <Text style={{ fontWeight: '600' }}>Unit code</Text>
        <Input value={unit.code} editable={false} style={{ backgroundColor: colors.bgSubtle }} />

        {center && (
          <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 6 }}>
            <MapView
              style={{ flex: 1 }}
              region={{
                latitude: center.latitude,
                longitude: center.longitude,
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
              }}
            >
              <Circle center={center} radius={radius} strokeColor={colors.green} fillColor="rgba(27,94,32,0.15)" />
              <Marker coordinate={center} pinColor={colors.green} />
            </MapView>
          </View>
        )}

        <Text style={{ fontWeight: '600' }}>Geofence radius: {radius} m</Text>
        <Slider
          minimumValue={10}
          maximumValue={100}
          step={5}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor={colors.green}
          thumbTintColor={colors.green}
        />

        <Text style={{ fontWeight: '600' }}>Session duration: {duration} min</Text>
        <Slider
          minimumValue={5}
          maximumValue={120}
          step={5}
          value={duration}
          onValueChange={setDuration}
          minimumTrackTintColor={colors.green}
          thumbTintColor={colors.green}
        />

        <View style={styles.toggle}>
          <Text style={{ flex: 1, fontWeight: '600' }}>Require selfie verification</Text>
          <Switch value={selfie} onValueChange={setSelfie} trackColor={{ true: colors.green }} thumbColor="#fff" />
        </View>
        <View style={styles.toggle}>
          <Text style={{ flex: 1, fontWeight: '600' }}>Notify students now</Text>
          <Switch value={notify} onValueChange={setNotify} trackColor={{ true: colors.green }} thumbColor="#fff" />
        </View>

        <Body muted style={{ fontSize: 12, marginTop: 4 }}>
          Students within {radius}m of the pinned point can sign in for the next {duration} minutes.
        </Body>
        <Button title="Start Session" variant="secondary" loading={starting} onPress={start} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
});
