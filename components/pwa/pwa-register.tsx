"use client";

import { useEffect, useState } from "react";

export function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {

        
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        setRegistration(reg);






        // Force check for updates immediately

        const updatedReg = await reg.update();


        // Check for updates when new worker is found
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;


          newWorker.addEventListener("statechange", () => {

            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {

              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates every 30 minutes
        setInterval(() => {

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
