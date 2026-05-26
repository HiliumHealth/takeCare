"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  Pill,
  Edit2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScheduleEntry {
  time: string;
  medications: string[];
}

interface MedicationScheduleProps {
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    times: string[];
  }>;
  onScheduleChange?: (schedule: ScheduleEntry[]) => void;
  readOnly?: boolean;
}

export function MedicationSchedule({
  medications,
  onScheduleChange,
  readOnly = false,
}: MedicationScheduleProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string | null>(null);

  // Build schedule from medications
  const schedule = useMemo(() => {
    const scheduleMap = new Map<string, Set<string>>();

    medications.forEach((med) => {
      med.times.forEach((time) => {
        if (!scheduleMap.has(time)) {
          scheduleMap.set(time, new Set());
        }
        scheduleMap.get(time)!.add(`${med.name} - ${med.dosage}`);
      });
    });

    return Array.from(scheduleMap.entries())
      .map(([time, meds]) => ({ time, medications: Array.from(meds) }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [medications]);

  // Get time periods
  const getTimePeriod = (time: string): "Morning" | "Afternoon" | "Evening" | "Night" => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  const groupedByPeriod = useMemo(() => {
    const groups: Record<string, ScheduleEntry[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };

    schedule.forEach((entry) => {
      const period = getTimePeriod(entry.time);
      groups[period].push(entry);
    });

    return groups;
  }, [schedule]);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimePeriodIcon = (
    period: "Morning" | "Afternoon" | "Evening" | "Night"
  ) => {
    const icons: Record<string, string> = {
      Morning: "🌅",
      Afternoon: "☀️",
      Evening: "🌆",
      Night: "🌙",
    };
    return icons[period];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bricolage font-black tracking-tighter flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-500" />
          Daily Medication Schedule
        </h3>
        <p className="text-xs text-black/40 font-medium">
          Patient will receive notifications at these times to take their
          medications.
        </p>
      </div>

      {/* Schedule Overview */}
      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-2xl border border-black/5 text-center">
          <Clock className="w-12 h-12 text-black/10 mb-4" />
          <p className="text-sm font-medium text-black/40">
            No medication schedule yet. Add medications above to create a schedule.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Period Groups */}
          {Object.entries(groupedByPeriod).map(([period, entries]) =>
            entries.length > 0 ? (
              <div key={period}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xl">{getTimePeriodIcon(period as any)}</span>
                  <h4 className="text-sm font-black uppercase tracking-widest text-black/50">
                    {period}
                  </h4>
                  <div className="flex-1 h-px bg-black/5" />
                  <span className="text-xs font-bold text-black/30">
                    {entries.length} reminder{entries.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-2 pl-6">
                  {entries.map((entry, idx) => (
                    <motion.div
                      key={`${period}-${entry.time}-${idx}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-8 top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />

                      {/* Time card */}
                      <button
                        onClick={() => !readOnly && setSelectedTime(entry.time)}
                        className={cn(
                          "w-full text-left bg-white rounded-xl border-2 transition-all p-4",
                          selectedTime === entry.time
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-black/5 hover:border-black/10 hover:shadow-sm"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                              <span className="text-2xl font-bricolage font-black tracking-tight">
                                {entry.time}
                              </span>
                              <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
                                {formatTime(entry.time)}
                              </span>
                            </div>

                            {/* Medications list */}
                            <div className="space-y-2">
                              {entry.medications.map((med, medIdx) => (
                                <div
                                  key={medIdx}
                                  className="flex items-start gap-2 text-sm font-medium text-black/70"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-emerald-500 mt-0.5 flex-shrink-0"
                                  />
                                  <span className="break-words">{med}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Reminder indicator */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-black uppercase tracking-widest text-blue-600">
                            <Pill size={12} />
                            Ready
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {selectedTime === entry.time && !readOnly && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3 text-sm"
                          >
                            <div className="flex items-start gap-3 text-blue-700">
                              <Info size={16} className="mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-bold mb-1">Reminder Details</p>
                                <ul className="text-xs space-y-1 opacity-90">
                                  <li>
                                    • Patient will be notified at {formatTime(entry.time)}
                                  </li>
                                  <li>• Notification includes medication names & dosages</li>
                                  <li>• Customizable sound available</li>
                                </ul>
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedTime(null)}
                              className="w-full py-2 rounded-lg bg-white text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors"
                            >
                              Close Details
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Summary Stats */}
      {schedule.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 pt-6 border-t border-black/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              label: "Total Reminders",
              value: schedule.length,
              icon: "🔔",
            },
            {
              label: "Medications",
              value: medications.length,
              icon: "💊",
            },
            {
              label: "Doses/Day",
              value: schedule.reduce((acc, s) => acc + s.medications.length, 0),
              icon: "📅",
            },
            {
              label: "Coverage",
              value: `${Math.ceil(((schedule.length / 4) * 100) / 25) * 25}%`,
              icon: "✨",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-lg p-4 text-center space-y-2 border border-black/5"
            >
              <span className="text-lg">{stat.icon}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/40">
                  {stat.label}
                </p>
                <p className="text-xl font-black tracking-tight mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div className="flex gap-3">
          <AlertCircle
            size={16}
            className="text-blue-600 mt-0.5 flex-shrink-0"
          />
          <div className="text-xs text-blue-700">
            <p className="font-bold mb-1">Smart Reminders Active</p>
            <p className="opacity-90">
              Patients will automatically receive push notifications at scheduled
              times. Sound can be customized for each medication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
