import AsyncStorage from '@react-native-async-storage/async-storage';

/** Set after user completes the permissions intro once; skips that screen on future launches. */
export const PERMISSION_ONBOARDING_KEY = 'ae.permissionOnboardingV1';

/** Call after any successful login so “Get Started” goes straight to sign-in, not permissions. */
export async function markPermissionOnboardingComplete() {
  await AsyncStorage.setItem(PERMISSION_ONBOARDING_KEY, '1');
}
