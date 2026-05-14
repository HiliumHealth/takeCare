"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "sonner";

export function PushSubscriptionButton() {
  const { subscribe, permission, subscription } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe();
      if (Notification.permission === "granted") {
        toast.success("Notifications enabled!", {
          description: "You'll receive alerts for doctor assessments and medications."
        });
      } else if (Notification.permission === "denied") {
        toast.error("Permission denied", {
          description: "Please enable notifications in your browser settings to receive alerts."
        });
      }
    } catch (err) {
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  if (permission === "granted" && subscription) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 px-4 py-4 rounded-2xl text-green-500 bg-green-500/5 border border-green-500/10">
          <Bell className="h-6 w-6" />
          <span className="font-bold text-sm tracking-tight">Mobile Alerts On</span>
        </div>
        <button
          onClick={async () => {
            const res = await fetch("/api/notifications/test", { method: "POST" });
            const data = await res.json();
            if (data.success) {
              toast.success("Test notification sent!");
            } else {
              toast.error(data.message || "Failed to send test");
            }
          }}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline px-4 text-left"
        >
          Send Test Notification
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-black/40 dark:text-white/40 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all group"
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : permission === "denied" ? (
        <BellOff className="h-6 w-6 text-red-500/50" />
      ) : (
        <Bell className="h-6 w-6 group-hover:animate-ring" />
      )}
      <div className="flex flex-col items-start text-left">
        <span className="font-bold text-sm tracking-tight">
          {permission === "denied" ? "Alerts Blocked" : "Get Mobile Alerts"}
        </span>
        <span className="text-[10px] opacity-60">Reminders & updates</span>
      </div>
    </button>
  );
}
