import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { JBConXLogo } from '@shared/components/JBConXLogo';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center p-1 border border-slate-200">
          <img src="/icon-512.webp" alt="JBConX" className="w-full h-full object-contain" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-900">Install JBConX CRM</h4>
          <p className="text-[11px] text-slate-500 font-medium">Add to your Home Screen for instant app access</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-[#274C77] hover:bg-[#1B3B6F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

