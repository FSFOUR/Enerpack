import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition active:scale-95 ${className}`}
          title="Install Enerpack App on your device"
        >
          <Download size={14} />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-95 border border-emerald-400/30 ${className}`}
      >
        <Smartphone size={15} className="text-emerald-200" />
        <span className="hidden sm:inline">Install Mobile App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-200 transition ${className}`}
          title="Add Enerpack to iPhone / iPad Home Screen"
        >
          <Smartphone size={14} className="text-blue-300" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-[#0f2a43] border border-blue-400/30 p-6 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-white text-sm">
                    E
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Install Enerpack on iOS</h3>
                    <p className="text-[10px] text-blue-200">Add to Home Screen for standalone app</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10 text-xs text-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Tap the <strong className="text-white inline-flex items-center gap-1 mx-1"><Share2 size={13} className="text-blue-400" /> Share</strong> icon in your Safari bottom toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Scroll down and select <strong className="text-white inline-flex items-center gap-1 mx-1"><PlusSquare size={13} className="text-emerald-400" /> Add to Home Screen</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Tap <strong className="text-white">Add</strong> in the top-right corner to launch with zero browser chrome!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2.5 text-xs font-bold text-white transition shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
