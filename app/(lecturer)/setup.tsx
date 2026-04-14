import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import Slider from '@react-native-community/slider';
import { Body, Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { JKUAT_BUILDINGS } from '../../src/data/jkuat-buildings';
import { repo } from '../../src/data/repo';
import { ClassUnit, Session } from '../../src/data/types';
import { colors, radius, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

type PinMode = 'gps' | 'building';

export default function Setup() {
  const router = useRouter();
  const { user } = useAuth();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const [unit, setUnit] = useState<ClassUnit | null>(null);
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>('gps');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(JKUAT_BUILDINGS[0]?.id ?? '');
  const [radius, setRadius] = useState(30);
  const [duration, setDuration] = useState(30);
  const [selfie, setSelfie] = useState(false);
  const [notify, setNotify] = useState(true);
  const [starting, setStarting] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  const applyGpsCenter = useCallback(async () => {
    let u: ClassUnit | null = null;
    try {
      const unitsList = await repo.getUnits();
      u = unitsList.find(x => x.id === unitId) || null;
    } catch {
      /* keep null */
    }

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'denied') {
      if (u) setCenter({ latitude: u.geofence.latitude, longitude: u.geofence.longitude });
      return;
    }
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
    }
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
  }, [unitId]);

  useEffect(() => {
    (async () => {
      let unitsList: ClassUnit[] = [];
      try {
        unitsList = await repo.getUnits();
      } catch {
        /* empty */
      }
      const u = unitsList.find(x => x.id === unitId) || null;
      setUnit(u);
      const saved = await AsyncStorage.getItem('ae.defaultRadius');
      if (saved) setRadius(Number(saved));
      else if (u) setRadius(u.geofence.radius);

      await applyGpsCenter();
    })();
  }, [unitId, applyGpsCenter]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'lecturer') {
      router.replace('/(student)/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== 'lecturer' || !unit) return;
    if (unit.lecturerId !== user.id) {
      router.replace('/(lecturer)/dashboard');
    }
  }, [unit, user, router]);

  useEffect(() => {
    if (pinMode !== 'building') return;
    const b = JKUAT_BUILDINGS.find(x => x.id === selectedBuildingId);
    if (b) setCenter({ latitude: b.latitude, longitude: b.longitude });
  }, [pinMode, selectedBuildingId]);

  const refreshGps = async () => {
    setGpsBusy(true);
    try {
      await applyGpsCenter();
    } finally {
      setGpsBusy(false);
    }
  };

  const start = async () => {
    if (!unit || !center || !user || user.role !== 'lecturer' || unit.lecturerId !== user.id) return;
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
    try {
      await repo.createSession(s);
      router.replace('/(lecturer)/active');
    } catch (e: any) {
      Alert.alert('Could not start session', e?.message ?? 'Please check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  if (!unit) return null;
  if (user && unit.lecturerId !== user.id) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar title="Set Up Session" tone="green" back />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl, gap: 14 }}>
        <Text style={{ fontWeight: '600' }}>Unit name</Text>
        <Input value={unit.name} editable={false} style={{ backgroundColor: colors.bgSubtle }} />
        <Text style={{ fontWeight: '600' }}>Unit code</Text>
        <Input value={unit.code} editable={false} style={{ backgroundColor: colors.bgSubtle }} />

        <Text style={{ fontWeight: '600' }}>Class location (geofence centre)</Text>
        <Body muted style={{ fontSize: 13, lineHeight: 20 }}>
          Students can sign attendance only when their phone is inside the circle on the map. Use your current GPS
          at the venue, or pick a JKUAT building preset.
        </Body>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => {
              setPinMode('gps');
              refreshGps();
            }}
            style={[styles.modeChip, pinMode === 'gps' && styles.modeChipOn]}
          >
            <Text style={[styles.modeChipText, pinMode === 'gps' && styles.modeChipTextOn]}>GPS here</Text>
          </Pressable>
          <Pressable onPress={() => setPinMode('building')} style={[styles.modeChip, pinMode === 'building' && styles.modeChipOn]}>
            <Text style={[styles.modeChipText, pinMode === 'building' && styles.modeChipTextOn]}>JKUAT building</Text>
          </Pressable>
        </View>

        {pinMode === 'gps' && (
          <Button title="Refresh GPS" variant="outline" loading={gpsBusy} onPress={refreshGps} style={{ alignSelf: 'flex-start' }} />
        )}

        {pinMode === 'building' && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600', fontSize: 13 }}>Choose building / zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {JKUAT_BUILDINGS.map(b => {
                const on = b.id === selectedBuildingId;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setSelectedBuildingId(b.id)}
                    style={[styles.buildingChip, on && styles.buildingChipOn]}
                  >
                    <Text style={[styles.buildingChipText, on && styles.buildingChipTextOn]} numberOfLines={2}>
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

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
  modeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  modeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  modeChipOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
  modeChipText: { fontWeight: '600', fontSize: 14, color: colors.text },
  modeChipTextOn: { color: colors.green },
  buildingChip: {
    maxWidth: 160,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  buildingChipOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
  buildingChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  buildingChipTextOn: { color: colors.green },
  toggle: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
});
