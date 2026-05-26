"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Pill,
  AlertCircle,
  ChevronDown,
  X,
  Bell,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: "Once Daily" | "Twice Daily" | "Thrice Daily" | "Four Times" | "Custom";
  times: string[];
  instructions: string;
  enableReminders: boolean;
  reminderSound: "soft-bell" | "gentle-chime" | "medical-alert" | "voice-only";
}

interface PrescriptionFormProps {
  medications: Medication[];
  onMedicationsChange: (medications: Medication[]) => void;
  onAddMedication: () => void;
  onRemoveMedication: (id: string) => void;
}

const FREQUENCY_OPTIONS = {
  "Once Daily": ["08:00"],
  "Twice Daily": ["08:00", "20:00"],
  "Thrice Daily": ["08:00", "14:00", "20:00"],
  "Four Times": ["08:00", "12:00", "16:00", "20:00"],
};

export function PrescriptionForm({
  medications,
  onMedicationsChange,
  onAddMedication,
  onRemoveMedication,
}: PrescriptionFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    medications[0]?.id || null
  );
  const [showReminder, setShowReminder] = useState<Record<string, boolean>>({});

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    const updated = medications.map((med) =>
      med.id === id ? { ...med, ...updates } : med
    );
    onMedicationsChange(updated);
  };

  const addTime = (id: string) => {
    const med = medications.find((m) => m.id === id);
    if (med && med.times.length < 6) {
      const lastTime = med.times[med.times.length - 1] || "08:00";
      const newTime = new Date();
      const [hours, minutes] = lastTime.split(":");
      newTime.setHours(parseInt(hours) + 2, 0, 0);
      const timeStr = `${String(newTime.getHours()).padStart(2, "0")}:${String(
        newTime.getMinutes()
      ).padStart(2, "0")}`;
      updateMedication(id, { times: [...med.times, timeStr] });
    }
  };

  const removeTime = (id: string, idx: number) => {
    const med = medications.find((m) => m.id === id);
    if (med && med.times.length > 1) {
      updateMedication(id, { times: med.times.filter((_, i) => i !== idx) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bricolage font-black tracking-tighter">
            Prescription & Treatment
          </h3>
          <p className="text-xs text-black/40 font-medium">
            Add medications with smart reminder scheduling for patients.
          </p>
        </div>
        <Button
          onClick={onAddMedication}
          className="rounded-xl h-11 px-5 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs gap-2 shadow-lg shadow-blue-500/20 w-fit whitespace-nowrap"
        >
          <Plus size={16} /> Add Medication
        </Button>
      </div>

      {/* Medications List */}
      <div className="space-y-3">
        {medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50/50 rounded-2xl border border-black/5 text-center">
            <Pill className="w-12 h-12 text-black/10 mb-4" />
            <p className="text-sm font-medium text-black/40">
              No medications added yet. Click "Add Medication" to start.
            </p>
          </div>
        ) : (
          medications.map((med) => (
            <motion.div
              key={med.id}
              layout
              className="relative group"
            >
              {/* Card */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === med.id ? null : med.id)
                }
                className="w-full text-left bg-white rounded-2xl border border-black/[0.05] hover:border-black/10 transition-all shadow-sm hover:shadow-md p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h4 className="text-lg font-black tracking-tight truncate">
                        {med.name || "Unnamed Medication"}
                      </h4>
                      <span className="text-xs font-black text-black/30 uppercase tracking-widest">
                        {med.dosage || "No dosage"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-black/50">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                        <Clock size={12} />
                        {med.times.length} time{med.times.length !== 1 ? "s" : ""}/
                        day
                      </span>
                      {med.enableReminders && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-600">
                          <Bell size={12} />
                          Reminders on
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMedication(med.id);
                      }}
                      className="p-2 rounded-lg hover:bg-rose-50 text-black/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove medication"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronDown
                      size={20}
                      className={cn(
                        "text-black/30 transition-transform flex-shrink-0",
                        expandedId === med.id && "rotate-180"
                      )}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === med.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50/50 border border-t-0 border-black/[0.05] rounded-b-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
                      {/* Basic Fields */}
                      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-black/30">
                            Medication Name
                          </Label>
                          <Input
                            value={med.name}
                            onChange={(e) =>
                              updateMedication(med.id, { name: e.target.value })
                            }
                            placeholder="e.g., Paracetamol"
                            className="h-11 rounded-lg bg-white border-black/5 font-bold px-4 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-black/30">
                            Dosage
                          </Label>
                          <Input
                            value={med.dosage}
                            onChange={(e) =>
                              updateMedication(med.id, { dosage: e.target.value })
                            }
                            placeholder="e.g., 500mg"
                            className="h-11 rounded-lg bg-white border-black/5 font-bold px-4 text-sm"
                          />
                        </div>
                      </div>

                      {/* Frequency Selector */}
                      <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-black/30">
                          Frequency
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.keys(FREQUENCY_OPTIONS).map((freq) => (
                            <button
                              key={freq}
                              onClick={() => {
                                updateMedication(med.id, {
                                  frequency: freq as Medication["frequency"],
                                  times:
                                    FREQUENCY_OPTIONS[
                                      freq as keyof typeof FREQUENCY_OPTIONS
                                    ],
                                });
                              }}
                              className={cn(
                                "px-3 py-2.5 rounded-lg font-bold text-xs transition-all border-2",
                                med.frequency === freq
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-black/60 border-black/10 hover:border-black/30"
                              )}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Picker */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black uppercase tracking-widest text-black/30 flex items-center gap-2">
                            <Clock size={12} /> Daily Dose Times
                          </Label>
                          {med.times.length < 6 && (
                            <button
                              onClick={() => addTime(med.id)}
                              className="text-xs font-black text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Time
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {med.times.map((time, idx) => (
                            <div
                              key={idx}
                              className="relative group/time"
                            >
                              <input
                                type="time"
                                value={time}
                                onChange={(e) => {
                                  const newTimes = [...med.times];
                                  newTimes[idx] = e.target.value;
                                  updateMedication(med.id, { times: newTimes });
                                }}
                                className="w-full px-3 py-2.5 rounded-lg bg-white border border-black/5 font-bold text-sm focus:ring-1 focus:ring-black/10 focus:border-transparent"
                              />
                              {med.times.length > 1 && (
                                <button
                                  onClick={() => removeTime(med.id, idx)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/time:opacity-100 transition-opacity"
                                  title="Remove time"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-black/30">
                          Special Instructions (Optional)
                        </Label>
                        <textarea
                          value={med.instructions}
                          onChange={(e) =>
                            updateMedication(med.id, {
                              instructions: e.target.value,
                            })
                          }
                          placeholder="e.g., Take with water, avoid dairy..."
                          className="w-full h-20 px-4 py-2.5 rounded-lg bg-white border border-black/5 font-medium text-sm resize-none focus:ring-1 focus:ring-black/10"
                        />
                      </div>

                      {/* Reminders Toggle */}
                      <div className="pt-4 border-t border-black/[0.05] space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell size={16} className="text-blue-500" />
                            <div>
                              <p className="text-sm font-black">
                                Smart Reminders
                              </p>
                              <p className="text-xs text-black/40">
                                Patient gets notifications at scheduled times
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              updateMedication(med.id, {
                                enableReminders: !med.enableReminders,
                              })
                            }
                            className={cn(
                              "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                              med.enableReminders
                                ? "bg-blue-500"
                                : "bg-black/10"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                                med.enableReminders ? "translate-x-7" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>

                        {/* Reminder Sound Selection */}
                        {med.enableReminders && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3"
                          >
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                              Notification Sound
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: "soft-bell", label: "Soft Bell", emoji: "🔔" },
                                { id: "gentle-chime", label: "Chime", emoji: "✨" },
                                { id: "medical-alert", label: "Alert", emoji: "🎵" },
                                { id: "voice-only", label: "Voice Only", emoji: "🎤" },
                              ].map((sound) => (
                                <button
                                  key={sound.id}
                                  onClick={() =>
                                    updateMedication(med.id, {
                                      reminderSound: sound.id as Medication["reminderSound"],
                                    })
                                  }
                                  className={cn(
                                    "px-3 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border-2",
                                    med.reminderSound === sound.id
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white text-black/60 border-blue-100 hover:border-blue-300"
                                  )}
                                >
                                  <span>{sound.emoji}</span>
                                  <span className="hidden sm:inline">{sound.label}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
