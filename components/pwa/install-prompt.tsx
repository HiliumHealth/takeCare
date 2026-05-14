"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay (don't interrupt the user immediately)
      const dismissed = localStorage.getItem("hilium-install-dismissed");
      const dismissedAt = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      // Show again if never dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 30000); // 30s delay
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[Hilium PWA] User accepted install prompt");
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (err) {
      console.error("[Hilium PWA] Install error:", err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("hilium-install-dismissed", Date.now().toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] lg:left-auto lg:right-6 lg:bottom-6 lg:w-96 animate-in slide-in-from-bottom-5 duration-700">
      <div className="relative bg-gradient-to-br from-primary via-primary to-indigo-700 text-white rounded-3xl p-5 shadow-2xl shadow-primary/40 border border-white/15 backdrop-blur-xl overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 relative">
          <div className="shrink-0 bg-white/15 rounded-2xl p-3">
            <Download className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base mb-1">Install Hilium</p>
            <p className="text-xs text-white/75 leading-relaxed mb-4">
              Add Hilium to your home screen for instant access to your health dashboard, even offline.
            </p>
            <button
              onClick={handleInstall}
              className="w-full py-2.5 px-4 bg-white text-primary rounded-xl font-bold text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
