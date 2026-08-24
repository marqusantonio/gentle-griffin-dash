import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Uploads a local file to Supabase Storage (media bucket) to get a public URL
 * readable by all devices/users with instant local object URL fallback.
 */
export const uploadFileToPublicStorage = async (
  file: File,
  folder = 'uploads'
): Promise<string> => {
  const localPreviewUrl = URL.createObjectURL(file);

  if (!isSupabaseConfigured()) {
    return localPreviewUrl;
  }

  try {
    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    // Upload to Supabase Storage 'media' bucket with timeout race
    const uploadPromise = supabase.storage.from('media').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Upload timeout fallback') }), 6000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    return localPreviewUrl;
  } catch {
    return localPreviewUrl;
  }
};