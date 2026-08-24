import { supabase, isSupabaseConfigured } from './supabase';

export const uploadFileToPublicStorage = async (
  file: File,
  folder = 'uploads'
): Promise<string> => {
  const localPreviewUrl = URL.createObjectURL(file);

  if (!isSupabaseConfigured()) {
    return localPreviewUrl;
  }

  try {
    // Attempt to create the 'media' bucket if it doesn't exist.
    // This is safe even if the bucket already exists; it will throw and we ignore.
    try {
      await supabase.storage.createBucket('media', { public: true });
    } catch (bucketError) {
      // Bucket likely already exists; continue.
    }

    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const uploadPromise = supabase.storage.from('media').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Upload timeout fallback') }), 8000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        // Return remote URL for persistence
        return publicUrlData.publicUrl;
      }
    }

    // If upload failed, we still return local blob for immediate viewing,
    // but the caller should know it's not persistent.
    console.warn('[storageUtils] Supabase storage upload failed, using local blob URL.', error);
    return localPreviewUrl;
  } catch (err) {
    console.warn('[storageUtils] Error uploading file:', err);
    return localPreviewUrl;
  }
};