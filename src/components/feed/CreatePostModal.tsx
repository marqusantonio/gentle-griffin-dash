import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  X, 
  Send, 
  Film, 
  Music2, 
  Tv, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { checkContentModeration } from '../../lib/supabase';
import { insertPostWithAutoFallback, insertClipWithAutoFallback } from '../../lib/schemaAdapter';
import { uploadFileToPublicStorage } from '../../lib/storageUtils';
import { PostItem, ShortClipItem } from '../../types/wevids';
import { getErrorMessage } from '../../lib/errorUtils';
import { toast } from 'sonner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: 'feed' | 'clips';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  isOpen, 
  onClose,
  defaultTarget = 'feed'
}) => {
  const { currentUser, setActiveView, addClip, syncWithSupabase } = useWevids();
  
  const [targetType, setTargetType] = useState<'feed' | 'clips'>(defaultTarget);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [audioTrack, setAudioTrack] = useState('Original Audio Track');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [selectedTag, setSelectedTag] = useState('#WEVIDS');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const popularTags = ['#WEVIDS', '#Tech', '#CustomROM', '#Anime', '#Gaming', '#Cyberpunk', '#Music', '#AI'];
  const quickEmojis = ['🔥', '⚡', '🚀', '✨', '💎', '🎮', '❤️', '🤯'];

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid format. Please select an image file (JPG, PNG, WebP, GIF)');
      return;
    }

    setMediaFile(file);
    setFileName(file.name);
    setFileSizeMb(Number((file.size / (1024 * 1024)).toFixed(2)));
    setMediaType('image');

    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);

    sounds.pop();
    toast.success(`Photo attached: ${file.name}`);
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSupported = file.type.includes('mp4') || file.type.includes('webm') || file.type.includes('quicktime') || file.type.includes('ogg');
    if (!isSupported) {
      toast.error('Unsupported video format. Please upload MP4 or WebM video.');
      return;
    }

    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > 250) {
      toast.error('File size exceeds 250MB limit. Please compress your video.');
      return;
    }

    setMediaFile(file);
    setFileName(file.name);
    setFileSizeMb(Number(sizeInMb.toFixed(2)));
    setMediaType('video');

    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);

    sounds.success();
    toast.success(`Video attached (${sizeInMb.toFixed(1)} MB)`);
  };

  const resetForm = () => {
    setContent('');
    setTitle('');
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaType(null);
    setFileName('');
    setFileSizeMb(0);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const moderation = checkContentModeration(`${title} ${content}`);
    if (moderation.flagged) {
      toast.error(moderation.reason);
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      let finalPublicMediaUrl: string | undefined = undefined;

      if (mediaFile) {
        setUploadProgress(50);
        finalPublicMediaUrl = await uploadFileToPublicStorage(mediaFile, targetType);
        setUploadProgress(85);
      } else if (mediaPreviewUrl) {
        finalPublicMediaUrl = mediaPreviewUrl;
      }

      setUploadProgress(95);

      if (targetType === 'clips') {
        const clipVideoUrl = finalPublicMediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

        const newClip: ShortClipItem = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: currentUser?.id || 'guest',
          title: title.trim() || 'New Short Clip',
          description: content.trim() || 'Vertical short clip uploaded on WEVIDS',
          videoUrl: clipVideoUrl,
          audioTrack: audioTrack.trim() || `${currentUser?.name || 'Creator'} · Original Audio`,
          likes: 0,
          dislikes: 0,
          shares: 0,
          comments: []
        };

        sounds.success();
        await addClip(newClip);
        toast.success('Vertical Short Clip published live!');
        resetForm();
        setActiveView('clips');
        onClose();
        setIsUploading(false);
        return;
      }

      if (!content.trim() && !finalPublicMediaUrl) {
        toast.error('Please write something or attach a photo/video');
        setIsUploading(false);
        return;
      }

      const newPost: PostItem = {
        id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUser?.id || 'guest',
        authorName: currentUser?.name || 'Creator',
        authorHandle: currentUser?.handle || '@creator',
        authorAvatar: currentUser?.avatar || 'C',
        authorColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        location: currentUser?.location || 'Earth Node',
        time: 'Just now',
        content: content.trim(),
        mediaUrl: finalPublicMediaUrl,
        mediaType: finalPublicMediaUrl ? (mediaType || 'image') : undefined,
        likes: 0,
        shares: 0,
        comments: [],
        tags: [selectedTag],
        created_at: new Date().toISOString()
      };

      sounds.success();
      toast.success('Post published live!');
      resetForm();
      setActiveView('feed');
      onClose();

      insertPostWithAutoFallback(newPost).then(({ error }) => {
        if (!error) syncWithSupabase(true);
      });
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-slate-900 text-sm shadow-md"
            style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {currentUser?.avatar || 'G'}
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
              <span>Create New Media</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] font-semibold border border-[#00e5ff]/30">60FPS HD</span>
            </h3>
            <div className="text-xs text-[#8a8aa8]">Posting as <strong className="text-white">{currentUser?.name || 'Creator'}</strong> ({currentUser?.handle || '@creator'})</div>
          </div>
        </div>

        {/* Target Destination Selector */}
        <div>
          <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block mb-1.5">
            Select Destination:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.click();
                setTargetType('feed');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold font-orbitron flex items-center justify-center gap-2 transition-all ${
                targetType === 'feed'
                  ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md border-transparent'
                  : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Community Feed</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                setTargetType('clips');
                setMediaType('video');
              }}
              className={`p-3 rounded-2xl border text-xs font-bold font-orbitron flex items-center justify-center gap-2 transition-all ${
                targetType === 'clips'
                  ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md border-transparent'
                  : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Vertical Short Clip</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {targetType === 'clips' && (
            <>
              <div>
                <label className="text-xs font-bold text-white block mb-1">Clip Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Snapdragon 8 Gen 3 Gaming Test / Custom ROM Mod"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1 flex items-center gap-1">
                  <Music2 className="w-3.5 h-3.5 text-[#ff2d95]" /> Audio Track Name
                </label>
                <input
                  type="text"
                  value={audioTrack}
                  onChange={(e) => setAudioTrack(e.target.value)}
                  placeholder="e.g. Cyber Horizon · Original Sound"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-white">
                {targetType === 'clips' ? 'Clip Description' : 'Post Thoughts / Text'}
              </label>
              <div className="flex items-center gap-1">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setContent(prev => prev + emoji)}
                    className="hover:scale-125 transition-transform text-xs p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={targetType === 'clips' ? 2 : 4}
              placeholder={targetType === 'clips' ? 'Tell viewers about this vertical short clip...' : 'What did you build, discover, test, or play today?'}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] resize-none"
            />
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImageFile}
          />
          <input
            type="file"
            ref={videoInputRef}
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleVideoFile}
          />

          {/* Media Preview Box */}
          {mediaPreviewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black max-h-52 flex items-center justify-center">
              {mediaType === 'image' ? (
                <img src={mediaPreviewUrl} alt="Upload preview" className="w-full h-full object-cover max-h-52" />
              ) : (
                <video src={mediaPreviewUrl} controls autoPlay loop muted playsInline className="w-full h-full object-cover max-h-52" />
              )}

              <button
                type="button"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreviewUrl(null);
                  setMediaType(null);
                  setFileName('');
                  setFileSizeMb(0);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors"
                title="Remove Media"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span>{mediaType}: {fileName} ({fileSizeMb} MB)</span>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#00e5ff] font-orbitron font-bold">
                <span>Publishing Short Clip to Public Feed...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#ff2d95] via-[#00e5ff] to-[#10b981] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Topic Tags */}
          {targetType === 'feed' && (
            <div>
              <label className="text-[11px] font-bold text-[#8a8aa8] block mb-1.5 uppercase tracking-wider">
                Topic Tag
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      selectedTag === tag
                        ? 'bg-[#ff2d95] text-slate-900 font-bold shadow-md'
                        : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/5'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2">
              {targetType === 'feed' && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    mediaType === 'image' ? 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                  title="Attach Photo"
                >
                  <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
                  <span>Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  mediaType === 'video' ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
                title="Attach MP4 / WebM Video"
              >
                <VideoIcon className="w-4 h-4 text-[#00e5ff]" />
                <span>Upload Video (MP4)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isUploading ? 'PUBLISHING...' : targetType === 'clips' ? 'PUBLISH SHORT' : 'PUBLISH POST'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};