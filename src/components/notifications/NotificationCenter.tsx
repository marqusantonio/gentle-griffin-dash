import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { useNotifications } from '../../hooks/useNotifications';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  FileText,
  Radio,
  X,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveView } = useWevids();
  const notifications = useNotifications();

  if (!isOpen) return null;

  const handleNotificationClick = (actionView: any) => {
    sounds.click();
    setActiveView(actionView);
    onClose();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-[#ff2d95]" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-[#00e5ff]" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[#10b981]" />;
      case 'post':
        return <FileText className="w-4 h-4 text-[#fbbf24]" />;
      case 'message':
        return <Radio className="w-4 h-4 text-purple-400 animate-pulse" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#ff2d95]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm h-full liquid-glass border-l border-white/20 p-4 sm:p-5 flex flex-col shadow-[0_0_80px_rgba(0,229,255,0.25)] animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#ff2d95] to-[#00e5ff] flex items-center justify-center text-slate-950 shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base text-white">
                NOTIFICATIONS
              </h2>
              <p className="text-[10px] text-[#8a8aa8]">
                {notifications.length} activity transmission{notifications.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8a8aa8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 scrollbar-none">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Bell className="w-8 h-8 text-[#00e5ff] opacity-40 animate-pulse" />
              </div>
              <p className="text-xs text-[#8a8aa8]">No new transmissions yet.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification.actionView)}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-start gap-3 transition-all group"
              >
                {/* Avatar / Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border border-white/20 group-hover:scale-105 transition-transform`}
                  style={{ background: notification.color }}
                >
                  <span className="text-xs font-bold text-slate-950">
                    {notification.avatar.length <= 2 ? notification.avatar : notification.avatar.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">
                      {notification.actorName}
                    </span>
                    <span className="text-[9px] text-[#8a8aa8] font-mono shrink-0">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#e8e8f4] leading-snug">
                    {notification.message}
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">{getIconForType(notification.type)}</div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 text-center">
          <span className="text-[10px] text-[#8a8aa8]">
            Real-time activity across WEVIDS nodes
          </span>
        </div>
      </div>
    </div>
  );
};