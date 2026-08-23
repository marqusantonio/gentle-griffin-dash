import React from 'react';
import { Radio, Check, X, Lock, Loader2 } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface RequestBannerProps {
  senderName: string;
  senderAvatar?: string;
  senderColor?: string;
  requestMessage?: string;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing?: boolean;
}

export const RequestBanner: React.FC<RequestBannerProps> = ({
  senderName,
  senderAvatar = 'C',
  senderColor = 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  requestMessage,
  onAccept,
  onDecline,
  isProcessing = false
}) => {
  return (
    <div className="p-4 rounded-3xl bg-slate-950/90 border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.25)] space-y-3 relative overflow-hidden backdrop-blur-xl animate-fade-in">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0 border border-white/40"
            style={{ background: senderColor }}
          >
            {senderAvatar}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-orbitron font-bold text-[9px] flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-purple-400" />
                INCOMING TRANSMISSION
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> 1-Msg Request Limit
              </span>
            </div>

            <div className="text-xs font-bold text-white mt-1">
              <span className="text-cyan-400">{senderName}</span> wants to connect and send messages.
            </div>

            {requestMessage && (
              <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                "{requestMessage}"
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end relative z-10">
          <button
            onClick={() => {
              sounds.click();
              onDecline();
            }}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-orbitron font-bold text-[10px] flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <X className="w-3.5 h-3.5" />
            <span>PURGE</span>
          </button>

          <button
            onClick={() => {
              sounds.success();
              onAccept();
            }}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-orbitron font-bold text-[10px] shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-1.5 transition-all hover:scale-105"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>ACCEPT LINK</span>
          </button>
        </div>
      </div>
    </div>
  );
};