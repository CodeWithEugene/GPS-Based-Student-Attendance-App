/**
 * Ensures `.env` is applied to `process.env` before Metro inlines `EXPO_PUBLIC_*`
 * during `android` release builds (`expo export:embed` / `./gradlew assembleRelease`).
 * Without this, the JS bundle can ship with the fallbacks in `src/lib/supabase.ts`
 * (`http://invalid.local`), causing "Network request failed" and broken Google OAuth.
 */
const path = require('path');
const { loadProjectEnv } = require('@expo/env');

// force:true ensures .env values are loaded even if empty EXPO_PUBLIC_* vars
// are already present in the shell environment.
loadProjectEnv(path.resolve(__dirname), { silent: true, force: true });

const appJson = require('./app.json');

const googleMapsKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...(appJson.expo.android || {}),
      // Google Maps Android SDK needs this entry on every build that embeds MapView.
      // When empty, maps render as a blank tile; the app still works for sign-in but
      // the preview panel on the lecturer setup screen will show an info card instead.
      config: {
        ...((appJson.expo.android || {}).config || {}),
        googleMaps: googleMapsKey ? { apiKey: googleMapsKey } : undefined,
      },
    },
    extra: {
      ...(appJson.expo.extra || {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      googleMapsApiKey: googleMapsKey,
    },
  },
};
