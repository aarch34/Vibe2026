"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./button";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      return;
    }

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="bg-gradient-to-r from-violet-900 to-indigo-900 border border-violet-500/50 shadow-xl shadow-black/40 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-violet-950/50 p-2 rounded-lg text-violet-300">
            <Download size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">Install VIBE 2026</h4>
            <p className="text-xs text-violet-200 mt-0.5">Add to your home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick} 
            size="sm" 
            className="bg-white text-indigo-950 hover:bg-violet-100 font-bold h-8 px-3"
          >
            Install
          </Button>
          <button 
            onClick={() => setShowInstallBanner(false)}
            className="p-1.5 text-violet-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
