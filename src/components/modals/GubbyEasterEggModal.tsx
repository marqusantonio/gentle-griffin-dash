import React from 'react';
import { X, Sparkles, PartyPopper } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface GubbyEasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GubbyEasterEggModal: React.FC<GubbyEasterEggModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    sounds.pop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 border border-[#ff2d95]/50 max-w-md w-full space-y-4 shadow-[0_0_80px_rgba(255,45,149,0.4)] relative text-center animate-spring-pop">
        {/* Close X Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors border border-white/10"
          title="Close Easter Egg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/40 text-[#ff2d95] font-orbitron font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>EASTER EGG UNLOCKED!</span>
        </div>

        {/* Gubby GIF */}
        <div className="rounded-2xl overflow-hidden border-2 border-[#00e5ff]/50 shadow-2xl bg-black relative aspect-video flex items-center justify-center">
          <img
            src="/kreekcraft-is-that-a-gubby.gif"
            alt="Is that a gubby"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Caption */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-orbitron text-white neon-gradient-text">
            is that a gubby easter egg
          </h2>
          <p className="text-xs text-[#8a8aa8]">
            You tapped the WEVIDS logo 5 times and summoned the legendary Gubby!
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform"
        >
          CLOSE GUBBY
        </button>
      </div>
    </div>
  );
};