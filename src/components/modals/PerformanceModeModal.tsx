import React from 'react';
import { Zap, Sparkles, Check, Monitor, Cpu } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface PerformanceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'entry' | 'highend';
  onSelectMode: (mode: 'entry' | 'highend') => void;
}

export const PerformanceModeModal: React.FC<PerformanceModeModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode
}) => {
  if (!isOpen) return null;

  const handleSelect = (mode: 'entry' | 'highend') => {
    sounds.success();
    onSelectMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/20 max-w-lg w-full space-y-5 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] font-orbitron font-bold text-[10px] border border-[#00e5ff]/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>WEVIDS GRAPHICS & ENGINE TUNER</span>
          </div>
          <h2 className="text-2xl font-bold font-orbitron text-white">
            Choose Your Graphics Mode
          </h2>
          <p className="text-xs text-[#8a8aa8] max-w-md mx-auto">
            Select your preferred rendering engine for optimal frame rate and smooth performance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OPTION 1: ENTRY / MIDRANGE (NO LIQUID GLASS - HIGH FPS) */}
          <div
            onClick={() => handleSelect('entry')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 group ${
              currentMode === 'entry'
                ? 'bg-[#00e5ff]/15 border-[#00e5ff] ring-2 ring-[#00e5ff]/30'
                : 'bg-white/5 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00e5ff] to-[#10b981] flex items-center justify-center text-slate-900 font-bold">
                  <Zap className="w-5 h-5 text-slate-900" />
                </div>
                {currentMode === 'entry' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00e5ff] text-slate-900 font-bold text-[9px] font-orbitron">
                    ACTIVE
                  </span>
                )}
              </div>

              <h3 className="font-orbitron font-bold text-sm text-white">
                Entry & Midrange Mode
              </h3>
              <p className="text-xs text-[#8a8aa8] leading-relaxed">
                ⚡ <strong>No liquid glass / No blur lag</strong>. Ultra-fast, 60–120 FPS rendering on Chrome, Android, & laptops.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md group-hover:scale-102 transition-transform"
            >
              Select Entry Mode (Fast)
            </button>
          </div>

          {/* OPTION 2: HIGH-END (LIQUID GLASS PRO) */}
          <div
            onClick={() => handleSelect('highend')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 group ${
              currentMode === 'highend'
                ? 'bg-[#ff2d95]/15 border-[#ff2d95] ring-2 ring-[#ff2d95]/30'
                : 'bg-white/5 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff2d95] to-[#9333ea] flex items-center justify-center text-white font-bold">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {currentMode === 'highend' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#ff2d95] text-slate-900 font-bold text-[9px] font-orbitron">
                    ACTIVE
                  </span>
                )}
              </div>

              <h3 className="font-orbitron font-bold text-sm text-white">
                High-End Mode
              </h3>
              <p className="text-xs text-[#8a8aa8] leading-relaxed">
                💎 <strong>Liquid Glass Pro</strong>. Frosted fluid refraction and specular glows for high-performance GPUs.
              </p>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md group-hover:scale-102 transition-transform"
            >
              Select High-End Mode
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-xs text-[#8a8aa8] hover:text-white transition-colors"
          >
            You can change this anytime from the top bar switcher.
          </button>
        </div>
      </div>
    </div>
  );
};