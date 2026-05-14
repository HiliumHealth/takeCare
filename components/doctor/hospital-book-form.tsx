"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, Clock, Pill, AlertCircle, Calendar, 
  Activity, Microscope, HeartPulse, Brain, ArrowRight,
  ClipboardList, Coffee, Dumbbell, Moon, XCircle, Gauge,
  Thermometer, Wind, Scale, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions: string;
}

export interface LabRequest {
  testName: string;
  urgency: "ROUTINE" | "URGENT" | "STAT";
  instructions: string;
}

interface HospitalBookFormProps {
  onDataChange: (data: any) => void;
}

export function HospitalBookForm({ onDataChange }: HospitalBookFormProps) {
  const [activeSection, setActiveSection] = useState("diagnosis");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  
  const [medications, setMedications] = useState<MedicationEntry[]>([
    { name: "", dosage: "", frequency: "Daily", times: ["08:00"], instructions: "" }
  ]);

  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  
  const [lifestyle, setLifestyle] = useState({
    diet: "",
    exercise: "",
    rest: ""
  });

  const [vitalTargets, setVitalTargets] = useState<{ label: string; target: string }[]>([]);
  
  const [vitals, setVitals] = useState({
    bp: "",
    pulse: "",
    temp: "",
    weight: "",
    spo2: ""
  });

  const notifyChange = (updates: any) => {
    onDataChange({
      diagnosis,
      notes,
      medications,
      labRequests,
      lifestyle,
      vitalTargets,
      vitals,
      followUpDate,
      ...updates
    });
  };

  const addMedication = () => {
    const newEntry: MedicationEntry = { name: "", dosage: "", frequency: "Daily", times: ["08:00"], instructions: "" };
    setMedications(prev => {
      const updated = [...prev, newEntry];
      notifyChange({ medications: updated });
      return updated;
    });
  };

  const addLabRequest = () => {
    const newLab: LabRequest = { testName: "", urgency: "ROUTINE", instructions: "" };
    setLabRequests(prev => {
      const updated = [...prev, newLab];
      notifyChange({ labRequests: updated });
      return updated;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 relative">
      
      {/* Floating Section Nav */}
      <nav className="lg:w-64 flex flex-row lg:flex-col gap-2 lg:sticky lg:top-32 h-fit z-10 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
        {[
          { id: "diagnosis", label: "Assessment", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
          { id: "vitals-check", label: "Vital Signs", icon: HeartPulse, color: "text-red-500", bg: "bg-red-50" },
          { id: "meds", label: "Medications", icon: Pill, color: "text-blue-500", bg: "bg-blue-50" },
          { id: "labs", label: "Lab Requests", icon: Microscope, color: "text-indigo-500", bg: "bg-indigo-50" },
          { id: "vitals", label: "Vital Targets", icon: Gauge, color: "text-rose-500", bg: "bg-rose-50" },
          { id: "lifestyle", label: "Care & Lifestyle", icon: Brain, color: "text-slate-600", bg: "bg-slate-50" },
          { id: "followup", label: "Follow-up", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-bold whitespace-nowrap lg:whitespace-normal text-left",
              activeSection === item.id 
                ? "bg-black text-white shadow-xl shadow-black/10 scale-[1.02]" 
                : "bg-white text-black/40 hover:bg-black/5"
            )}
          >
            <item.icon size={18} className={cn(activeSection === item.id ? "text-white" : item.color)} />
            <span className="text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 space-y-12 min-w-0">
        <AnimatePresence mode="wait">
          
          {/* ASSESSMENT SECTION */}
          {activeSection === "diagnosis" && (
            <motion.section
              key="diagnosis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-bricolage font-black tracking-tighter">Checkup Summary</h3>
                <p className="text-[11px] text-black/40 font-medium">Record primary diagnosis and supporting observations.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Main Condition Found</Label>
                  <Input 
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      notifyChange({ diagnosis: e.target.value });
                    }}
                    placeholder="Enter the main diagnosis..."
                    className="h-12 rounded-xl bg-slate-50 border-none text-base font-bold px-4 focus-visible:ring-1 focus-visible:ring-black/5"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Notes for the Patient</Label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      notifyChange({ notes: e.target.value });
                    }}
                    placeholder="Describe symptoms, findings, and general impressions..."
                    className="min-h-[140px] rounded-2xl bg-slate-50 border-none p-4 font-medium text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-black/5 resize-none"
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* VITAL SIGNS SECTION */}
          {activeSection === "vitals-check" && (
            <motion.section
              key="vitals-check"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-bricolage font-black tracking-tighter">Vital Signs</h3>
                <p className="text-[11px] text-black/40 font-medium">Record the patient's current clinical measurements.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Blood Pressure", key: "bp", icon: Activity, placeholder: "120/80", unit: "mmHg" },
                  { label: "Pulse Rate", key: "pulse", icon: HeartPulse, placeholder: "72", unit: "bpm" },
                  { label: "SpO2 Level", key: "spo2", icon: Wind, placeholder: "98", unit: "%" },
                  { label: "Temperature", key: "temp", icon: Thermometer, placeholder: "36.5", unit: "°C" },
                  { label: "Weight", key: "weight", icon: Scale, placeholder: "70", unit: "kg" },
                ].map((field) => (
                  <div key={field.key} className="bg-slate-50/50 rounded-2xl p-5 border border-black/[0.03]">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center text-black/30">
                          <field.icon size={14} />
                       </div>
                       <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30">{field.label}</Label>
                    </div>
                    <div className="relative">
                      <Input 
                        value={(vitals as any)[field.key]}
                        onChange={(e) => {
                          const newVitals = { ...vitals, [field.key]: e.target.value };
                          setVitals(newVitals);
                          notifyChange({ vitals: newVitals });
                        }}
                        placeholder={field.placeholder}
                        className="h-10 rounded-xl bg-white border-black/5 font-bold px-3 pr-12 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-black/20 uppercase">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* MEDICATIONS SECTION */}
          {activeSection === "meds" && (
            <motion.section
              key="meds"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bricolage font-black tracking-tighter">Prescription & Treatment</h3>
                  <p className="text-[11px] text-black/40 font-medium">Schedule precise medication intake for smart push notifications.</p>
                </div>
                <Button 
                  onClick={addMedication}
                  className="rounded-xl h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs gap-2 shadow-lg shadow-blue-500/10"
                >
                  <Plus size={16} /> Add Drug
                </Button>
              </div>

              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="bg-slate-50/50 rounded-2xl p-6 border border-black/[0.03] relative group">
                    <button 
                      onClick={() => {
                        const newMeds = medications.filter((_, i) => i !== index);
                        setMedications(newMeds);
                        notifyChange({ medications: newMeds });
                      }}
                      className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-black/10 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Medication Name</Label>
                        <Input 
                          value={med.name}
                          onChange={(e) => {
                            const newMeds = medications.map((m, i) => i === index ? { ...m, name: e.target.value } : m);
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          placeholder="e.g. Paracetamol"
                          className="h-11 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Dosage</Label>
                        <Input 
                          value={med.dosage}
                          onChange={(e) => {
                            const newMeds = medications.map((m, i) => i === index ? { ...m, dosage: e.target.value } : m);
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          placeholder="e.g. 500mg"
                          className="h-11 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1 flex items-center gap-2">
                        <Clock size={10} /> Daily Dose Times (24h)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {med.times.map((time, tIdx) => (
                          <div key={tIdx} className="bg-white rounded-xl p-1 pr-2 flex items-center gap-2 border border-black/5">
                            <input 
                              type="time"
                              value={time}
                              onChange={(e) => {
                                const newMeds = medications.map((m, i) => {
                                  if (i === index) {
                                    const newTimes = [...m.times];
                                    newTimes[tIdx] = e.target.value;
                                    return { ...m, times: newTimes };
                                  }
                                  return m;
                                });
                                setMedications(newMeds);
                                notifyChange({ medications: newMeds });
                              }}
                              className="bg-transparent border-none text-[10px] font-black p-1.5 outline-none"
                            />
                            {med.times.length > 1 && (
                              <button 
                                onClick={() => {
                                  const newMeds = medications.map((m, i) => {
                                    if (i === index) {
                                      return { ...m, times: m.times.filter((_, t) => t !== tIdx) };
                                    }
                                    return m;
                                  });
                                  setMedications(newMeds);
                                  notifyChange({ medications: newMeds });
                                }}
                                className="text-black/10 hover:text-rose-500"
                              >
                                <XCircle size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newMeds = medications.map((m, i) => 
                              i === index ? { ...m, times: [...m.times, "12:00"] } : m
                            );
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Special Advice for these Meds</Label>
                      <Textarea 
                        value={med.instructions}
                        onChange={(e) => {
                          const newMeds = medications.map((m, i) => i === index ? { ...m, instructions: e.target.value } : m);
                          setMedications(newMeds);
                          notifyChange({ medications: newMeds });
                        }}
                        placeholder="Ex: Take with food. Avoid dairy."
                        className="min-h-[60px] rounded-xl bg-white border-black/5 p-3 font-medium text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
          {/* LAB REQUESTS SECTION */}
          {activeSection === "labs" && (
            <motion.section
              key="labs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bricolage font-black tracking-tighter">Recommended Tests</h3>
                  <p className="text-[11px] text-black/40 font-medium">Request laboratory tests, imaging, or specialized screenings.</p>
                </div>
                <Button 
                  onClick={addLabRequest}
                  className="rounded-xl h-10 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs gap-2 shadow-lg shadow-indigo-500/10"
                >
                  <Microscope size={16} /> Request Test
                </Button>
              </div>

              <div className="space-y-4">
                {labRequests.map((lab, index) => (
                  <div key={index} className="bg-slate-50/50 rounded-2xl p-6 border border-black/[0.03] relative group">
                    <button 
                      onClick={() => {
                        const newLabs = labRequests.filter((_, i) => i !== index);
                        setLabRequests(newLabs);
                        notifyChange({ labRequests: newLabs });
                      }}
                      className="absolute top-6 right-6 p-2 text-black/10 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="grid md:grid-cols-[1fr_160px] gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Name of the Test</Label>
                        <Input 
                          value={lab.testName}
                          onChange={(e) => {
                            const newLabs = labRequests.map((l, i) => i === index ? { ...l, testName: e.target.value } : l);
                            setLabRequests(newLabs);
                            notifyChange({ labRequests: newLabs });
                          }}
                          placeholder="e.g. Full Blood Count (FBC)"
                          className="h-11 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Urgency</Label>
                        <select 
                          value={lab.urgency}
                          onChange={(e) => {
                            const newLabs = labRequests.map((l, i) => i === index ? { ...l, urgency: e.target.value as any } : l);
                            setLabRequests(newLabs);
                            notifyChange({ labRequests: newLabs });
                          }}
                          className="w-full h-11 rounded-xl bg-white border border-black/5 px-3 text-xs font-black appearance-none outline-none focus:ring-1 focus:ring-black/5"
                        >
                          <option value="ROUTINE">ROUTINE</option>
                          <option value="URGENT">URGENT</option>
                          <option value="STAT">STAT</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">How to prepare for this test</Label>
                      <Textarea 
                        value={lab.instructions}
                        onChange={(e) => {
                          const newLabs = labRequests.map((l, i) => i === index ? { ...l, instructions: e.target.value } : l);
                          setLabRequests(newLabs);
                          notifyChange({ labRequests: newLabs });
                        }}
                        placeholder="Ex: Fasting for 12 hours required."
                        className="min-h-[60px] rounded-xl bg-white border-black/5 p-3 font-medium text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}

                {labRequests.length === 0 && (
                  <div className="bg-slate-50/50 rounded-2xl border border-dashed border-black/10 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Microscope className="text-indigo-500" size={20} />
                    </div>
                    <p className="font-bold text-black/40 text-sm">No laboratory investigations requested.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* VITAL TARGETS SECTION */}
          {activeSection === "vitals" && (
            <motion.section
              key="vitals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bricolage font-black tracking-tighter">Monitoring Goals</h3>
                  <p className="text-[11px] text-black/40 font-medium">Set targets for wearable device monitoring.</p>
                </div>
                <Button 
                  onClick={() => {
                    const newTarget = { label: "", target: "" };
                    setVitalTargets(prev => {
                      const updated = [...prev, newTarget];
                      notifyChange({ vitalTargets: updated });
                      return updated;
                    });
                  }}
                  className="rounded-xl h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs gap-2 shadow-lg shadow-rose-500/10"
                >
                  <Plus size={16} /> Add Target
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {vitalTargets.map((v, index) => (
                  <div key={index} className="bg-slate-50/50 rounded-2xl p-6 border border-black/[0.03] relative group">
                    <button 
                      onClick={() => {
                        const newTargets = vitalTargets.filter((_, i) => i !== index);
                        setVitalTargets(newTargets);
                        notifyChange({ vitalTargets: newTargets });
                      }}
                      className="absolute top-6 right-6 p-2 text-black/10 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Metric (e.g. Heart Rate)</Label>
                        <Input 
                          value={v.label}
                          onChange={(e) => {
                            const newTargets = vitalTargets.map((t, i) => i === index ? { ...t, label: e.target.value } : t);
                            setVitalTargets(newTargets);
                            notifyChange({ vitalTargets: newTargets });
                          }}
                          placeholder="Heart Rate, BP, SpO2..."
                          className="h-11 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">Threshold / Goal</Label>
                        <Input 
                          value={v.target}
                          onChange={(e) => {
                            const newTargets = vitalTargets.map((t, i) => i === index ? { ...t, target: e.target.value } : t);
                            setVitalTargets(newTargets);
                            notifyChange({ vitalTargets: newTargets });
                          }}
                          placeholder="e.g. < 100 bpm"
                          className="h-11 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {vitalTargets.length === 0 && (
                  <div className="col-span-2 bg-slate-50/50 rounded-2xl border border-dashed border-black/10 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
                      <Gauge className="text-rose-500" size={20} />
                    </div>
                    <p className="font-bold text-black/40 text-sm">No vital targets set.</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* LIFESTYLE SECTION */}
          {activeSection === "lifestyle" && (
            <motion.section
              key="lifestyle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-bricolage font-black tracking-tighter">Healthy Living Tips</h3>
                <p className="text-[11px] text-black/40 font-medium">Guide lifestyle adjustments for optimal recovery.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: "diet", label: "Nutrition & Diet", icon: Coffee, color: "bg-orange-50 text-orange-500", placeholder: "Ex: Low sodium..." },
                  { id: "exercise", label: "Physical Activity", icon: Dumbbell, color: "bg-emerald-50 text-emerald-500", placeholder: "Ex: Light walking..." },
                  { id: "rest", label: "Sleep & Recovery", icon: Moon, color: "bg-indigo-50 text-indigo-500", placeholder: "Ex: 8 hours sleep..." },
                ].map((item) => (
                  <div key={item.id} className="bg-slate-50/50 rounded-2xl p-6 border border-black/[0.03] space-y-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                      <item.icon size={18} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1">{item.label}</Label>
                      <Textarea 
                        value={(lifestyle as any)[item.id]}
                        onChange={(e) => {
                          const newLife = { ...lifestyle, [item.id]: e.target.value };
                          setLifestyle(newLife);
                          notifyChange({ lifestyle: newLife });
                        }}
                        placeholder={item.placeholder}
                        className="min-h-[100px] rounded-xl bg-white border-black/5 p-3 font-medium text-xs resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* FOLLOW-UP SECTION */}
          {activeSection === "followup" && (
            <motion.section
              key="followup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-bricolage font-black tracking-tighter">Next Appointment</h3>
                <p className="text-[11px] text-black/40 font-medium">Schedule the next clinical review.</p>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-8 border border-black/[0.03] max-w-md">
                 <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20 ml-1 flex items-center gap-2">
                        <Calendar size={10} /> Proposed Follow-up Date
                      </Label>
                      <Input 
                        type="date"
                        value={followUpDate}
                        onChange={(e) => {
                          setFollowUpDate(e.target.value);
                          notifyChange({ followUpDate: e.target.value });
                        }}
                        className="h-12 rounded-xl bg-white border-black/5 font-bold px-4 text-sm"
                      />
                    </div>
                    
                    <div className="p-4 bg-white rounded-xl border border-black/5 flex items-start gap-3">
                      <Brain className="text-black/20 shrink-0 mt-0.5" size={14} />
                      <p className="text-[10px] font-bold text-black/40 leading-relaxed uppercase tracking-wider">
                        We'll send a friendly reminder to the patient 24 hours before this date.
                      </p>
                    </div>
                 </div>
              </div>
            </motion.section>
          )}

        </AnimatePresence>

        {/* Global Nav Buttons */}
        <div className="pt-12 border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Auto-Save Active</span>
          </div>
          
          <div className="flex items-center gap-4">
             {activeSection !== "diagnosis" && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    const sections = ["diagnosis", "vitals-check", "meds", "labs", "vitals", "lifestyle", "followup"];
                    const currIdx = sections.indexOf(activeSection);
                    setActiveSection(sections[currIdx - 1]);
                  }}
                  className="h-14 px-8 rounded-2xl font-bold text-black/40 hover:bg-black/5"
                >
                  Previous
                </Button>
             )}
             
             {activeSection !== "followup" ? (
                <Button 
                  onClick={() => {
                    const sections = ["diagnosis", "vitals-check", "meds", "labs", "vitals", "lifestyle", "followup"];
                    const currIdx = sections.indexOf(activeSection);
                    setActiveSection(sections[currIdx + 1]);
                  }}
                  className="h-14 px-10 bg-black text-white rounded-2xl font-black flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                >
                  Continue <ArrowRight size={18} />
                </Button>
             ) : (
                 <div className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Ready for Final Review</span>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
