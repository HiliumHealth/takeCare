"use client";

import { useEffect, useState } from "react";

export function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        console.log("[Hilium PWA] Starting service worker registration...");
        
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        setRegistration(reg);
        console.log("[Hilium PWA] ✓ Service worker registered successfully");
        console.log("[Hilium PWA] Registration scope:", reg.scope);
        console.log("[Hilium PWA] Active:", reg.active?.state);
        console.log("[Hilium PWA] Installing:", reg.installing?.state);
        console.log("[Hilium PWA] Waiting:", reg.waiting?.state);

        // Force check for updates immediately
        console.log("[Hilium PWA] Checking for updates...");
        const updatedReg = await reg.update();
        console.log("[Hilium PWA] Update check completed");

        // Check for updates when new worker is found
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          console.log("[Hilium PWA] New service worker installing...");
          newWorker.addEventListener("statechange", () => {
            console.log(`[Hilium PWA] SW state changed: ${newWorker.state}`);
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[Hilium PWA] Update available - new SW installed");
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates every 30 minutes
        setInterval(() => {
          console.log("[Hilium PWA] Checking for updates (interval)...");
          reg.update();
        }, 30 * 60 * 1000);

      } catch (error) {
        console.error("[Hilium PWA] ✗ Service worker registration failed:", error);
      }
    };

    // Register after page load for performance
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  // Handle the update prompt
  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] lg:left-auto lg:right-6 lg:bottom-6 lg:w-80 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-primary text-white rounded-2xl p-4 shadow-2xl shadow-primary/30 border border-white/10 backdrop-blur-xl">
        <p className="text-sm font-semibold mb-1">Update Available</p>
        <p className="text-xs text-white/70 mb-3">
          A new version of Hilium is ready. Refresh to get the latest features.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setUpdateAvailable(false)}
            className="flex-1 text-xs py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 text-xs py-2 px-3 rounded-xl bg-white text-primary hover:bg-white/90 transition-colors font-bold"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
