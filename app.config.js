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
