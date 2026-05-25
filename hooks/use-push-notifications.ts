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
      console.log("[Push] Starting subscription process...");
      
      // 1. Request permission
      const result = await Notification.requestPermission();
      console.log(`[Push] Notification permission result: ${result}`);
      setPermission(result);

      if (result !== "granted") {
        console.warn("[Push] Permission not granted. User either denied or dismissed the prompt.");
        return;
      }

      console.log("[Push] Permission granted, fetching VAPID key...");
      
      // Fetch the latest VAPID public key from the server dynamically
      // to avoid Next.js build-time caching of environment variables.
      const vapidRes = await fetch("/api/notifications/vapid-key");
      const vapidData = await vapidRes.json();
      const publicKey = vapidData.publicKey;
      
      if (!publicKey) {
        throw new Error("Failed to get VAPID public key from server");
      }
      
      console.log(`[Push] Got VAPID key: ${publicKey.substring(0, 20)}...`);

      // 2. Subscribe to push
      console.log("[Push] Subscribing to push manager...");
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("[Push] ✓ Subscription created:", {
        endpoint: sub.endpoint.substring(0, 50) + "...",
        auth: sub.getKey("auth")?.toString().substring(0, 20) + "...",
        p256dh: sub.getKey("p256dh")?.toString().substring(0, 20) + "...",
      });

      setSubscription(sub);

      // 3. Send subscription to server
      console.log("[Push] Sending subscription to server...");
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify(sub),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const serverResponse = await response.json();
      console.log("[Push] ✓ Server accepted subscription:", serverResponse);
      console.log("[Push] ✓ Subscription successful and saved to database!");
    } catch (err) {
      console.error("[Push] ✗ Subscription failed:", err);
      throw err;
    }
  };

  const unsubscribe = async () => {
    if (!registration) {
      console.warn("[Push] No service worker registration found");
      return;
    }
    try {
      console.log("[Push] Getting current subscription...");
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        console.log("[Push] Unsubscribing from push manager...");
        await sub.unsubscribe();
        console.log("[Push] ✓ Unsubscribed from push manager");
        setSubscription(null);
        console.log("[Push] ✓ Unsubscribe successful");
      } else {
        console.log("[Push] No active subscription found");
      }
    } catch (err) {
      console.error("[Push] ✗ Unsubscribe failed:", err);
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
