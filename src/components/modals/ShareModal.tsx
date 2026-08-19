import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const ShareModal: React.FC = () => {
  const { activeShare, closeShareModal } = useWevids();
  const [copied, setCopied] = useState(false);

  if (!activeShare) return null;

  const handleCopy = () => {
    sounds.click();
    navigator.clipboard.writeText(activeShare.url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#ff2d95]" />
            Share Content
          </div>
          <button onClick={closeShareModal} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
        </div>

        <p className="text-xs text-[#e8e8f4] font-medium">{activeShare.title}</p>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10">
          <span className="text-xs text-[#8a8aa8] truncate flex-1 font-mono">{activeShare.url}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[#ff2d95] text-slate-900 font-bold hover:scale-105 transition-transform"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeShare.title)}&url=${encodeURIComponent(activeShare.url)}`}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-center text-white"
          >
            Twitter / X
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(activeShare.title + ' ' + activeShare.url)}`}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-center text-white"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};