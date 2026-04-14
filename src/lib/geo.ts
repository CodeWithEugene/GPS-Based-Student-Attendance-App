export type LatLng = { latitude: number; longitude: number };

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function isInsideGeofence(
  user: LatLng,
  center: LatLng,
  radiusMeters: number,
): boolean {
  return haversineMeters(user, center) <= radiusMeters;
}
