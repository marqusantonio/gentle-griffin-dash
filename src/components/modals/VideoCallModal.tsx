import React, { useState, useEffect, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Sparkles, 
  Heart, 
  Zap, 
  Radio, 
  Maximize2, 
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const VideoCallModal: React.FC = () => {
  const { isVideoCallOpen, closeVideoCall, activeCallUser, currentUser } = useWevids();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [reactions, setReactionList] = useState<Array<{ id: number; symbol: string; left: number }>>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize webcam stream when call starts
  useEffect(() => {
    if (!isVideoCallOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCallSeconds(0);
      return;
    }

    // Call duration timer
    const timer = setInterval(() => {
      setCallSeconds(s => s + 1);
    }, 1000);

    // Try starting local camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available, gracefully fallback
        });
    }

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isVideoCallOpen]);

  if (!isVideoCallOpen) return null;

  const toggleMic = () => {
    sounds.click();
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    sounds.click();
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = () => {
    sounds.pop();
    const nextState = !isScreenSharing;
    setIsScreenSharing(nextState);
    if (nextState) {
      toast.success('Screen Sharing transmission active!');
    } else {
      toast.info('Returned to Camera View.');
    }
  };

  const triggerReaction = (symbol: string) => {
    sounds.like();
    const id = Date.now();
    const left = Math.floor(Math.random() * 80) + 10;
    setReactionList(prev => [...prev, { id, symbol, left }]);
    setTimeout(() => {
      setReactionList(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-5xl liquid-glass rounded-3xl border border-white/20 p-4 sm:p-6 flex flex-col justify-between shadow-[0_0_80px_rgba(0,229,255,0.3)] h-[85vh] relative overflow-hidden">
        
        {/* Floating Reaction Floating Particles */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {reactions.map(r => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-20 text-3xl animate-bounce transition-all duration-1000 transform -translate-y-40 opacity-90 drop-shadow-[0_0_15px_#ff2d95]"
            >
              {r.symbol}
            </div>
          ))}
        </div>

        {/* Call Header Status */}
        <div className="flex items-center justify-between text-white font-orbitron text-xs sm:text-sm pb-3 border-b border-white/10 relative z-20">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#10b981] animate-ping" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#00e5ff]">{activeCallUser || 'Creator Node'}</span>
              <span className="text-[#8a8aa8] hidden sm:inline">· HD 1080p WebRTC Encrypted</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10 font-mono text-[#fbbf24] font-bold">
              ⏱️ {formatTimer(callSeconds)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#ff2d95]/20 text-[#ff2d95] border border-[#ff2d95]/40 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#ff2d95]" /> SECURE
            </span>
          </div>
        </div>

        {/* Video Stage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 my-3 relative z-10 overflow-hidden">
          
          {/* Remote Creator Stream */}
          <div className="rounded-3xl overflow-hidden bg-slate-950 border border-white/15 relative flex items-center justify-center shadow-2xl group">
            {isScreenSharing ? (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Monitor className="w-16 h-16 text-[#00e5ff] animate-pulse" />
                <div className="font-orbitron font-bold text-sm text-white">
                  Sharing Screen Transmission
                </div>
                <p className="text-xs text-[#8a8aa8]">1080p 60FPS Low-Latency Pipeline Active</p>
              </div>
            ) : (
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
            )}

            <div className="absolute bottom-3 left-3 px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md text-xs text-white font-bold flex items-center gap-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
              <span>{activeCallUser || 'Remote Creator'}</span>
            </div>
          </div>

          {/* Local User Webcam Stream */}
          <div className="rounded-3xl overflow-hidden bg-slate-950 border border-white/15 relative flex items-center justify-center shadow-2xl group">
            {isVideoOff ? (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-slate-900 text-2xl shadow-xl"
                  style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                >
                  {currentUser?.avatar || 'U'}
                </div>
                <div className="font-orbitron font-bold text-xs text-white mt-2">Camera Paused</div>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            <div className="absolute bottom-3 left-3 px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md text-xs text-white font-bold flex items-center gap-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>{currentUser.name} (You)</span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-20">
          
          {/* Reaction Triggers */}
          <div className="flex items-center gap-1.5">
            {['❤️', '🔥', '👏', '⚡', '🎉', '🤯'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerReaction(emoji)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-sm hover:scale-125 transition-transform"
                title={`Send ${emoji} Reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl font-bold transition-all ${
                isMuted ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl font-bold transition-all ${
                isVideoOff ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isVideoOff ? 'Start Camera' : 'Turn Off Camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl font-bold transition-all ${
                isScreenSharing ? 'bg-[#00e5ff] text-slate-900 shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title="Toggle Screen Share"
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                sounds.pop();
                closeVideoCall();
              }}
              className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold text-xs shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:scale-105 transition-transform flex items-center gap-2"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span>END CALL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};