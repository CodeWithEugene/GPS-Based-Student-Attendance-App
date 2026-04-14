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

// Bake Supabase public config into the native manifest so release APKs always
// have URLs/keys at runtime. Metro does not always inline EXPO_PUBLIC_* when
// Gradle runs `expo export:embed`; `expo.extra` is read via expo-constants.
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
};
