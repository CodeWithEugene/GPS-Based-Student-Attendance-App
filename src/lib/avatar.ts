import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { getSessionUserIdForWrite, supabase } from './supabase';
import { repo } from '../data/repo';

const BUCKET = 'avatars';

export type AvatarResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'error'; message: string };

/**
 * Pick an image from the device library, compress to a 512px square JPEG,
 * upload to the `avatars` Supabase bucket under `<auth_uid>/<ts>.jpg`,
 * and persist the public URL to `profiles.avatar_url`.
 */
export async function pickAndUploadAvatar(userId: string): Promise<AvatarResult> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, reason: 'error', message: 'Photo library permission was denied.' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return { ok: false, reason: 'cancelled' };
    const pickedUri = result.assets[0].uri;

    // Resize + re-encode as JPEG base64 so we can push raw bytes to Supabase Storage
    const manipulated = await ImageManipulator.manipulateAsync(
      pickedUri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (!manipulated.base64) {
      return { ok: false, reason: 'error', message: 'Could not read the selected photo.' };
    }

    const authUid = await getSessionUserIdForWrite();
    const path = `${authUid}/${Date.now()}.jpg`;
    const bytes = decodeBase64(manipulated.base64);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (upErr) return { ok: false, reason: 'error', message: upErr.message };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // cache-bust so the <Image> component re-fetches after replacement
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

    await repo.updateUserAvatar(userId, publicUrl);
    return { ok: true, url: publicUrl };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message ?? 'Upload failed.' };
  }
}
