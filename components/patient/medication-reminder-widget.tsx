// components/patient/medication-reminder-widget.tsx
"use client";

import React, { useState } from "react";
import {
  Bell,
  Pill,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMedicationReminders } from "@/hooks/use-medication-reminders";
import { cn } from "@/lib/utils";

export function MedicationReminderWidget() {
  const [testMode, setTestMode] = useState(false);
  const [testSound, setTestSound] = useState<
    "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only"
  >("soft-bell");

  const {
    isListening,
    soundSupported,
    voiceSupported,
    lastReminder,
    playTestReminder,
  } = useMedicationReminders({
    onReminderReceived: (reminder) => {
      toast.success("Medication Reminder", {
        description: `Take ${reminder.medicationName} (${reminder.dosage})`,
        duration: 10000,
      });
    },
    onError: (error) => {
      toast.error("Reminder Error", {
        description: error.message,
      });
    },
  });

  const handleTestReminder = async () => {
    try {
      await playTestReminder(
        "Test Medication",
        "500mg",
        testSound,
        "Take with water"
      );
      toast.success("Test reminder played successfully");
    } catch (error) {
      toast.error("Failed to play test reminder");
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200 p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Smart Medication Reminders</h3>
            </div>
            <p className="text-sm text-blue-800/70">
              You will receive notifications at scheduled times.
            </p>
          </div>
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
              isListening
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {isListening ? "✓ Active" : "• Standby"}
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">
              Sound: {soundSupported ? "✓" : "✗"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">
              Voice: {voiceSupported ? "✓" : "✗"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Last Reminder */}
      <AnimatePresence>
        {lastReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Last Reminder</p>
                <p className="text-sm text-emerald-800 mt-1">
                  {lastReminder.medicationName} - {lastReminder.dosage}
                </p>
                <p className="text-xs text-emerald-700/60 mt-1">
                  at {lastReminder.time}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Controls */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => setTestMode(!testMode)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          {testMode ? "Hide Test Controls" : "Test Reminders"}
        </button>

        <AnimatePresence>
          {testMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Sound Type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "soft-bell", label: "🔔 Soft Bell" },
                    { id: "gentle-chime", label: "✨ Chime" },
                    { id: "medical-alert", label: "🎵 Alert" },
                    { id: "voice-only", label: "🎤 Voice" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() =>
                        setTestSound(
                          option.id as typeof testSound
                        )
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-bold transition-all border-2",
                        testSound === option.id
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleTestReminder}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Play Test Reminder
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Test all notification sounds and voice capabilities
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 flex gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-bold mb-1">Notification Troubleshooting</p>
          <ul className="space-y-1 text-blue-600/80">
            <li>• Ensure notifications are enabled in browser settings</li>
            <li>• Reminders only work when app is open or service worker is active</li>
            <li>• Test sounds require speaker volume enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
