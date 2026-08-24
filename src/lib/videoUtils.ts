export const RELIABLE_VIDEO_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
];

export const isValidVideoUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    trimmed.length < 6 ||
    trimmed === 'none' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'NaN' ||
    trimmed === 'false' ||
    trimmed === 'true'
  ) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:video') ||
    trimmed.startsWith('blob:')
  );
};

export const isRemoteVideoUrl = (url: string | null | undefined): boolean => {
  if (!isValidVideoUrl(url)) return false;
  return url!.startsWith('https://') || url!.startsWith('http://');
};

export const isBlobVideoUrl = (url: string | null | undefined): boolean => {
  if (!isValidVideoUrl(url)) return false;
  return url!.startsWith('blob:');
};

export const resolveVideoUrl = (
  candidates: (string | null | undefined)[],
  fallbackIndex = 0
): string => {
  // Prefer remote URLs (persistent) over blob/data URLs.
  for (const url of candidates) {
    if (isRemoteVideoUrl(url)) return url!.trim();
  }
  // Fall back to any valid URL (blob/data) if no remote available.
  for (const url of candidates) {
    if (isValidVideoUrl(url)) return url!.trim();
  }
  return RELIABLE_VIDEO_STREAMS[fallbackIndex % RELIABLE_VIDEO_STREAMS.length];
};

export const filterValidVideoUrl = (url: string | null | undefined): boolean => {
  if (!isValidVideoUrl(url)) return false;
  // We still accept blob for same-session, but remote is preferred for persistence.
  return true;
};