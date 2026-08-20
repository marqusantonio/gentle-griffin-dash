import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles, 
  X, 
  Send, 
  Hash, 
  MapPin,
  Film,
  UploadCloud
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { addPost, currentUser } = useWevids();
  
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedTag, setSelectedTag] = useState('#WEVIDS31');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const popularTags = ['#WEVIDS31', '#HyperOS', '#AndroidModding', '#AnimeCinema', '#Cyberpunk', '#Minecraft', '#LoFiBeats'];

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
      toast.error('Please select a valid MP4 or WebM video file');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) {
      toast.error('Please type a message or upload media');
      return;
    }

    addPost({
      userId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      authorColor: currentUser.color,
      location: currentUser.location,
      time: 'Just now',
      content: content.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      tags: [selectedTag]
    });

    sounds.success();
    setContent('');
    setMediaUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl relative">
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
            style={{ background: currentUser.color }}
          >
            {currentUser.avatar}
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-base text-white">Create Feed Post</h3>
            <div className="text-xs text-[#00e5ff]">Posting as {currentUser.name} ({currentUser.handle})</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Share your latest ROM flash, gameplay clip, synth beats, or video render..."
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/30 resize-none"
          />

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
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black max-h-56 flex items-center justify-center">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover max-h-56" />
              ) : (
                <video src={mediaUrl} controls autoPlay loop className="w-full h-full object-cover max-h-56" />
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
                {mediaType}: {fileName || 'Attached'}
              </span>
            </div>
          )}

          {/* Tags picker */}
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

          {/* Action Toolbar */}
          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                title="Attach Photo"
              >
                <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
                <span className="hidden sm:inline">Add Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                title="Attach Video"
              >
                <VideoIcon className="w-4 h-4 text-[#00e5ff]" />
                <span className="hidden sm:inline">Add Video</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isUploading ? 'ATTACHING...' : 'PUBLISH POST'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};