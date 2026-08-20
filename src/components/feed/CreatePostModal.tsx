import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles, 
  X, 
  Send, 
  Film,
  Music2,
  Tv
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { checkContentModeration } from '../../lib/supabase';
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
  const { addPost, addClip, currentUser, setActiveView } = useWevids();
  
  const [targetType, setTargetType] = useState<'feed' | 'clips'>(defaultTarget);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [audioTrack, setAudioTrack] = useState('Original Audio Track');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedTag, setSelectedTag] = useState('#WEVIDS');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const popularTags = ['#WEVIDS', '#Tech', '#CustomROM', '#Anime', '#Gaming', '#Cyberpunk', '#Music'];

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setFileName(file.name);
    setMediaType('image');
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setIsUploading(false);
      sounds.pop();
      toast.success(`Photo attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM)');
      return;
    }

    setFileName(file.name);
    setMediaType('video');
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setIsUploading(false);
      sounds.success();
      toast.success(`Video attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setContent('');
    setTitle('');
    setMediaUrl(null);
    setFileName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // AI / Safety Content Moderation Check
    const moderation = checkContentModeration(`${title} ${content}`);
    if (moderation.flagged) {
      toast.error(moderation.reason);
      return;
    }

    if (targetType === 'clips') {
      if (!mediaUrl && !content.trim() && !title.trim()) {
        toast.error('Please upload a video or provide a title for your Clip');
        return;
      }

      await addClip({
        id: `clip-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        title: title.trim() || 'New Creator Short Clip',
        description: content.trim() || 'Vertical short clip uploaded on WEVIDS',
        videoUrl: mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        audioTrack: audioTrack.trim() || `${currentUser?.name || 'Creator'} · Original Audio`,
        likes: 0,
        dislikes: 0,
        shares: 0,
        comments: []
      });

      resetForm();
      setActiveView('clips');
      onClose();
      return;
    }

    if (!content.trim() && !mediaUrl) {
      toast.error('Please type a message or upload media');
      return;
    }

    const success = await addPost({
      userId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Creator',
      authorHandle: currentUser?.handle || '@creator',
      authorAvatar: currentUser?.avatar || 'C',
      authorColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      location: currentUser?.location || 'Earth Node',
      time: 'Just now',
      content: content.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      tags: [selectedTag]
    });

    if (success) {
      resetForm();
      setActiveView('feed');
      onClose();
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
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md"
            style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {currentUser?.avatar || 'G'}
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-base text-white">Publish Creator Content</h3>
            <div className="text-xs text-[#00e5ff]">Posting as {currentUser?.name || 'Creator'} ({currentUser?.handle || '@creator'})</div>
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
              <span>Shorts Clip (Vertical)</span>
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
                  placeholder="e.g. Crazy Gaming Combo or Shader Test"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
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
                  placeholder="e.g. Neon Horizon · Original Sound"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-white block mb-1">
              {targetType === 'clips' ? 'Clip Description' : 'Post Thoughts / Text'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={targetType === 'clips' ? 2 : 3}
              placeholder={targetType === 'clips' ? 'Tell viewers about this vertical clip...' : 'What did you build, discover, or play today?'}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] resize-none"
            />
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
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
          {mediaUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black max-h-52 flex items-center justify-center">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover max-h-52" />
              ) : (
                <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-cover max-h-52" />
              )}

              <button
                type="button"
                onClick={() => {
                  setMediaUrl(null);
                  setFileName('');
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors"
                title="Remove Media"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                {mediaType}: {fileName || 'Ready'}
              </span>
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                  title="Attach Photo"
                >
                  <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
                  <span>Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                title="Attach Video File"
              >
                <VideoIcon className="w-4 h-4 text-[#00e5ff]" />
                <span>Upload Video</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isUploading ? 'UPLOADING...' : targetType === 'clips' ? 'PUBLISH CLIP' : 'PUBLISH POST'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};