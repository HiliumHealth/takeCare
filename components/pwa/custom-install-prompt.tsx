"use client";

import React, { useState, useEffect } from "react";
import { usePWA } from "@/hooks/use-pwa";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomInstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after 5 seconds if installable and not dismissed
    if (isInstallable && !hasDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, hasDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
  };

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
  };

  if (typeof window === "undefined") return null;

  return (
    <AnimatePresence>
      {isVisible && isInstallable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[100]"
        >
          <div className="bg-white dark:bg-[#0f0f0f] rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-black/[0.03] dark:border-white/[0.05] relative overflow-hidden group">
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-2xl group-hover:bg-purple-500/10 transition-colors" />

            <button 
              onClick={handleDismiss}
              className="absolute top-6 right-6 p-2 text-black/20 dark:text-white/20 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20 relative">
                  <img src="/hilium.png" alt="Hilium" className="w-10 h-10 object-contain invert" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg">
                    <Sparkles size={12} className="fill-current" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black font-bricolage tracking-tight text-black dark:text-white">Hilium Mobile</h3>
                  <div className="flex items-center gap-2 text-black/40 dark:text-white/40 font-bold text-[10px] uppercase tracking-widest">
                    <Smartphone size={10} /> App Experience
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-black/60 dark:text-white/60 leading-relaxed">
                  Install Hilium on your home screen for quick access to your health records and instant medication reminders.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight bg-blue-500/5 dark:bg-blue-500/10 p-2 rounded-xl">
                    <CheckCircle2 size={12} /> Live Alerts
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-tight bg-purple-500/5 dark:bg-purple-500/10 p-2 rounded-xl">
                    <CheckCircle2 size={12} /> Faster Access
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleInstall}
                  className="flex-1 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                >
                  <Download size={20} /> Install App
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-14 px-6 rounded-2xl font-bold text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
