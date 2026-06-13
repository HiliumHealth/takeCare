"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function NotificationDebugger() {
  const [swRegistered, setSwRegistered] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    checkStatus();
    // Check again every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      // Check SW
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        setSwRegistered(registrations.length > 0);
        registrations.forEach(reg => {

        });
      }

      // Check push support
      const hasSupport = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setPushSupported(hasSupport);


      // Check permission
      if ("Notification" in window) {
        setPermission(Notification.permission);

      }

      // Check subscription
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          const reg = registrations[0];
          const sub = await reg.pushManager.getSubscription();
          setHasSubscription(!!sub);

          if (sub) {

          }
        }
      }
    } catch (err) {
      console.error("[Debug] Error checking status:", err);
    }
  };

  const runDiagnostics = async () => {
    try {
      const res = await fetch("/api/notifications/diagnose");
      const data = await res.json();

      
      let message = `Subscriptions: ${data.subscriptionCount}\n`;
      if (data.issues.length > 0) {
        message += `Issues: ${data.issues.join(", ")}\n`;
      }
      if (data.recommendations.length > 0) {
        message += `Recommendations: ${data.recommendations.join(" | ")}\n`;
      }
      
      toast.info("Check console for full diagnostics", {
        description: message
      });
    } catch (err) {
      toast.error("Failed to run diagnostics");
    }
  };

  return (
    <div className="hidden">
      <button
        onClick={runDiagnostics}
        className="text-xs opacity-50 hover:opacity-100"
        title="Run push notification diagnostics"
      >
        📊
      </button>
    </div>
  );
}
