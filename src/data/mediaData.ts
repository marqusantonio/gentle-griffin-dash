import { AudioTrackItem, FilmItem, SharedFileItem } from '../types/wevids';

export const INITIAL_AUDIO_TRACKS: AudioTrackItem[] = [
  {
    id: 't-1',
    title: 'Neon Tokyo Midnight Rain',
    artist: 'Aiko Tanaka x WEVIDS Synth Lab',
    duration: '03:45',
    genre: 'Synthwave / Cyberpunk',
    bpm: 120,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-2',
    title: 'Persian Saffron Sunset Acoustic',
    artist: 'Sara from Tehran',
    duration: '04:12',
    genre: 'Ambient World Fusion',
    bpm: 88,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
    cover: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-3',
    title: 'Snapdragon Hyper Overclock Pulse',
    artist: 'Carlos Mendez (ROM Dev)',
    duration: '02:50',
    genre: 'Hard Techno Glitch',
    bpm: 144,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cyberpunk-2099-10701.mp3',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
  }
];

export const INITIAL_FILMS: FilmItem[] = [
  {
    id: 'film-1',
    title: 'Neo-Genesis 2088: The Silicon Frontier',
    synopsis: 'A rogue neural programmer discovers an encrypted kernel anomaly inside Tokyo’s quantum power grid that allows human consciousness transfer.',
    director: 'Aiko Tanaka',
    releaseYear: 2026,
    duration: '1h 48m',
    genre: 'Cyberpunk Sci-Fi',
    rating: 4.9,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80',
    views: '482K'
  },
  {
    id: 'film-2',
    title: 'Open Source Revolution: The Kernel Chronicles',
    synopsis: 'An inside documentary investigating the worldwide underground network of Android ROM porters, Linux kernel hackers, and custom hardware modders.',
    director: 'Carlos Mendez',
    releaseYear: 2026,
    duration: '1h 22m',
    genre: 'Tech Documentary',
    rating: 4.8,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
    views: '320K'
  },
  {
    id: 'film-3',
    title: 'Echoes of Tehran: The Saffron Road',
    synopsis: 'A visually breathtaking journey through ancient Persian architectural marvels, modern poetry, and the enduring human spirit connecting continents.',
    director: 'Sara from Tehran',
    releaseYear: 2026,
    duration: '1h 35m',
    genre: 'Open Source Action',
    rating: 5.0,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
    views: '610K'
  }
];

export const INITIAL_FILES: SharedFileItem[] = [
  {
    id: 'f-1',
    title: 'Snapdragon 8 Gen 3 Thermal & FPS Governor',
    fileName: 'sd8gen3_thermal_bypass.zip',
    fileSize: '18.4 MB',
    category: 'ROM / Kernel',
    uploaderId: 'carlos',
    uploaderName: 'Carlos Mendez',
    downloadUrl: '#',
    checksum: 'e8f7a932b14c90d6e42a19ff88b643ce219f01ab92',
    downloads: 1420,
    uploadedAt: '2 days ago'
  }
];