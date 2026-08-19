import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { PhoneOff, Mic, MicOff, Video, Sparkles } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const VideoCallModal: React.FC = () => {
  const { isVideoCallOpen, closeVideoCall, activeCallUser, currentUser } = useWevids();
  if (!isVideoCallOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-4xl liquid-glass rounded-3xl border border-white/20 p-6 flex flex-col justify-between shadow-2xl h-[80vh]">
        <div className="flex items-center justify-between text-white font-orbitron text-sm pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
            <span>Encrypted Video Call: {activeCallUser || 'Creator Room'}</span>
          </div>
          <span className="text-xs text-[#00e5ff]">HD 1080p 60FPS</span>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-4">
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative flex items-center justify-center">
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs text-white font-bold">
              {activeCallUser || 'Caller'}
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative flex items-center justify-center">
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs text-white font-bold">
              {currentUser.name} (You)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
          <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={closeVideoCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-110 transition-transform"
            title="Hang Up"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};