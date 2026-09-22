import React from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 flex items-center justify-between gap-3 rounded-2xl bg-amber-600/95 backdrop-blur-md px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-amber-400/40 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-200 animate-ping shrink-0" />
        <div className="flex items-center gap-1.5">
          <WifiOff size={15} />
          <span>Offline Mode — Cached local data active</span>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition shrink-0"
        title="Retry connection"
      >
        <RefreshCw size={13} />
      </button>
    </div>
  );
};
