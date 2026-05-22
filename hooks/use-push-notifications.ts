"use client";

import { usePWA } from "@/hooks/use-pwa";
import { useEffect, useState } from "react";

export function usePushNotifications() {
  const { registration } = usePWA();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (registration) {
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscription(sub);
          // Sync with server just in case
          fetch("/api/notifications/subscribe", {
            method: "POST",
            body: JSON.stringify(sub),
            headers: { "Content-Type": "application/json" },
          }).catch(console.error);
        }
      });
    }
  }, [registration]);

  const subscribe = async () => {
    if (!registration) {
      console.error("[Push] No service worker registration found");
      return;
    }

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        console.warn("[Push] Permission not granted");
        return;
      }

      // Fetch the latest VAPID public key from the server dynamically
      // to avoid Next.js build-time caching of environment variables.
      const vapidRes = await fetch("/api/notifications/vapid-key");
      const { publicKey } = await vapidRes.json();
      
      if (!publicKey) {
        throw new Error("Failed to get VAPID public key from server");
      }

      // 2. Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setSubscription(sub);

      // 3. Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify(sub),
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("[Push] Subscribed successfully");
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    }
  };

  const unsubscribe = async () => {
    if (!registration) return;
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        setSubscription(null);
        console.log("[Push] Unsubscribed successfully");
      }
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    }
  };

  return {
    subscribe,
    unsubscribe,
    subscription,
    permission,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
