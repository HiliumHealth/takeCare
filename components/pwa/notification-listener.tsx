"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function NotificationListener() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleServiceWorkerMessage = (event: any) => {


      if (event.data.type === "NOTIFICATION_SHOWN") {

        toast.success(event.data.data.title, {
          description: event.data.data.body,
        });
      } else if (event.data.type === "NOTIFICATION_FALLBACK") {

        // If window is focused and system notification failed, show in-app toast
        toast.info(event.data.data.title, {
          description: event.data.data.body,
          duration: 5000,
        });
      }
    };

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);

    // Also check if there are existing service workers and listen to them
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        if (reg.active) {

        }
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  return null;
}
