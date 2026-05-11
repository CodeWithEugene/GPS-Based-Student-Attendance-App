import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { colors, radius, shadows, spacing } from '../theme';

type LatLng = { latitude: number; longitude: number };

/**
 * OpenStreetMap + Leaflet inside a WebView.
 * Works on Android & iOS with no API key. Supports tap-to-pick + drag when `interactive`.
 */
export function GeofenceMap({
  center,
  radiusMeters,
  label,
  style,
  showUserLocation,
  interactive,
  onCenterChange,
}: {
  center: LatLng | null;
  radiusMeters: number;
  label?: string;
  style?: ViewStyle;
  showUserLocation?: boolean;
  /** When true, taps and marker drag move the geofence centre. */
  interactive?: boolean;
  /** Called with the new centre when the user taps/drags. */
  onCenterChange?: (next: LatLng) => void;
}) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () =>
      buildHtml({
        lat: center?.latitude ?? 0,
        lng: center?.longitude ?? 0,
        radius: radiusMeters,
        label: label ?? '',
        interactive: !!interactive,
        showUser: !!showUserLocation,
      }),
    // Build once; subsequent prop changes are pushed via injectJavaScript below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Push external centre changes (e.g. GPS refresh, building preset) into the map.
  useEffect(() => {
    if (!center) return;
    webRef.current?.injectJavaScript(
      `window.__setCenter && window.__setCenter(${center.latitude}, ${center.longitude}); true;`,
    );
  }, [center?.latitude, center?.longitude]);

  // Push radius changes.
  useEffect(() => {
    webRef.current?.injectJavaScript(
      `window.__setRadius && window.__setRadius(${radiusMeters}); true;`,
    );
  }, [radiusMeters]);

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
    const { latitude, longitude } = center;
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string; lat?: number; lng?: number };
      if (msg.type === 'center' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
        onCenterChange?.({ latitude: msg.lat, longitude: msg.lng });
      }
    } catch {
      /* ignore malformed */
    }
  };

  return (
    <View style={[styles.shell, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        style={{ flex: 1, backgroundColor: colors.bgSubtle }}
        // Keeping the WebView opaque avoids flicker on Android.
        setSupportMultipleWindows={false}
      />
      <Pressable onPress={openInMaps} style={[styles.openChip, shadows.sm]}>
        <Ionicons name="open-outline" size={13} color={colors.green} />
        <Text style={styles.openChipText}>Open in OSM</Text>
      </Pressable>
      {interactive ? (
        <View style={styles.hintChip}>
          <Ionicons name="hand-left-outline" size={12} color={colors.text} />
          <Text style={styles.hintChipText}>Tap or drag pin</Text>
        </View>
      ) : null}
      <Text style={styles.attribution}>© OpenStreetMap</Text>
    </View>
  );
}

function buildHtml({
  lat,
  lng,
  radius,
  label,
  interactive,
  showUser,
}: {
  lat: number;
  lng: number;
  radius: number;
  label: string;
  interactive: boolean;
  showUser: boolean;
}): string {
  const safeLabel = label.replace(/'/g, "\\'").replace(/</g, '&lt;');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #eef3ef; }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var INITIAL_LAT = ${lat};
  var INITIAL_LNG = ${lng};
  var INTERACTIVE = ${interactive ? 'true' : 'false'};
  var SHOW_USER = ${showUser ? 'true' : 'false'};
  var LABEL = '${safeLabel}';

  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([INITIAL_LAT, INITIAL_LNG], 17);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  var marker = L.marker([INITIAL_LAT, INITIAL_LNG], { draggable: INTERACTIVE }).addTo(map);
  if (LABEL) marker.bindTooltip(LABEL, { permanent: false });

  var circle = L.circle([INITIAL_LAT, INITIAL_LNG], {
    radius: ${radius},
    color: '#1B5E20',
    weight: 2,
    fillColor: '#1B5E20',
    fillOpacity: 0.15,
  }).addTo(map);

  function send(lat, lng) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'center', lat: lat, lng: lng }));
    }
  }

  if (INTERACTIVE) {
    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      send(e.latlng.lat, e.latlng.lng);
    });
    marker.on('dragend', function () {
      var p = marker.getLatLng();
      circle.setLatLng(p);
      send(p.lat, p.lng);
    });
  }

  if (SHOW_USER && navigator.geolocation) {
    var userDot = null;
    navigator.geolocation.watchPosition(function (pos) {
      var ll = [pos.coords.latitude, pos.coords.longitude];
      if (!userDot) {
        userDot = L.circleMarker(ll, {
          radius: 6,
          color: '#1A56DB',
          weight: 2,
          fillColor: '#1A56DB',
          fillOpacity: 0.9,
        }).addTo(map);
      } else {
        userDot.setLatLng(ll);
      }
    }, function () {}, { enableHighAccuracy: true, maximumAge: 5000 });
  }

  window.__setCenter = function (lat, lng) {
    marker.setLatLng([lat, lng]);
    circle.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom() < 16 ? 17 : map.getZoom());
  };
  window.__setRadius = function (r) {
    circle.setRadius(r);
  };
})();
</script>
</body>
</html>`;
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
  fallbackTitle: { fontWeight: '800', fontSize: 15, color: colors.text, marginTop: 2 },
  fallbackSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  openChip: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: colors.white,
  },
  openChipText: { color: colors.green, fontWeight: '800', fontSize: 12 },
  hintChip: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, backgroundColor: colors.white,
    ...shadows.sm,
  },
  hintChipText: { color: colors.text, fontWeight: '800', fontSize: 11 },
  attribution: {
    position: 'absolute', bottom: 4, left: 6,
    fontSize: 9, color: colors.textMuted, fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4, borderRadius: 3,
  },
});
