import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Uploads a local file to Supabase Storage (media bucket) to get a public URL
 * readable by all devices/users.
 */
export const uploadFileToPublicStorage = async (
  file: File,
  folder = 'uploads'
): Promise<string> => {
  if (!isSupabaseConfigured()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    // Attempt upload to Supabase Storage 'media' bucket
    const { data, error } = await supabase.storage.from('media').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    // Fallback: If bucket does not exist or fails, convert images/audio to Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};