"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
  deferredPrompt: any;
  isInstallable: boolean;
  installApp: () => Promise<void>;
  updateAvailable: boolean;
  applyUpdate: () => void;
  registration: ServiceWorkerRegistration | null;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Capture the Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("[Hilium PWA] Install prompt captured");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Register Service Worker & Handle Updates
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });

          setRegistration(reg);

          // Check for updates periodically
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });
        } catch (error) {
          console.error("[Hilium PWA] SW registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Hilium PWA] User response to install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isInstallable,
        installApp,
        updateAvailable,
        applyUpdate,
        registration,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
