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
    const fileBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(fileBuffer);

    const { data, error } = await supabase.functions.invoke('upload-media', {
      body: {
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type,
        folder,
      },
    });

    if (!error && data?.publicUrl) {
      return data.publicUrl;
    }

    console.warn('[storageUtils] Edge function upload failed, using local blob URL.', error || data?.error);
    return localPreviewUrl;
  } catch (err) {
    console.warn('[storageUtils] Error uploading file:', err);
    return localPreviewUrl;
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}