"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, Clock, Pill, AlertCircle, Calendar, 
  Activity, Microscope, HeartPulse, Sparkles, ArrowRight,
  ClipboardList, Coffee, Dumbbell, Moon, XCircle, Gauge
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

  const notifyChange = (updates: any) => {
    onDataChange({
      diagnosis,
      notes,
      medications,
      labRequests,
      lifestyle,
      followUpDate,
      ...updates
    });
  };

  const addMedication = () => {
    const newMeds = [...medications, { name: "", dosage: "", frequency: "Daily", times: ["08:00"], instructions: "" }];
    setMedications(newMeds);
    notifyChange({ medications: newMeds });
  };

  const addLabRequest = () => {
    const newLabs = [...labRequests, { testName: "", urgency: "ROUTINE", instructions: "" }];
    setLabRequests(newLabs);
    notifyChange({ labRequests: newLabs });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 relative">
      
      {/* Floating Section Nav */}
      <nav className="lg:w-64 flex flex-row lg:flex-col gap-2 lg:sticky lg:top-32 h-fit z-10 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
        {[
          { id: "diagnosis", label: "Assessment", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
          { id: "meds", label: "Medications", icon: Pill, color: "text-blue-500", bg: "bg-blue-50" },
          { id: "labs", label: "Lab Requests", icon: Microscope, color: "text-indigo-500", bg: "bg-indigo-50" },
          { id: "vitals", label: "Vital Targets", icon: Gauge, color: "text-rose-500", bg: "bg-rose-50" },
          { id: "lifestyle", label: "Care & Lifestyle", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50" },
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
          
          {/* DIAGNOSIS SECTION */}
          {activeSection === "diagnosis" && (
            <motion.section
              key="diagnosis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-4xl font-bricolage font-black tracking-tighter">Clinical Impression</h3>
                <p className="text-black/40 font-medium">State the primary condition and high-level assessment.</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl shadow-black/[0.02] space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Primary Diagnosis</Label>
                  <Input 
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      notifyChange({ diagnosis: e.target.value });
                    }}
                    placeholder="Enter the main diagnosis..."
                    className="h-16 rounded-2xl bg-slate-50 border-none text-xl font-bold px-6 focus-visible:ring-2 focus-visible:ring-black/5"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Clinical Observations</Label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      notifyChange({ notes: e.target.value });
                    }}
                    placeholder="Describe symptoms, findings, and general impressions..."
                    className="min-h-[200px] rounded-3xl bg-slate-50 border-none p-6 font-medium text-lg leading-relaxed focus-visible:ring-2 focus-visible:ring-black/5 resize-none"
                  />
                </div>
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
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-4xl font-bricolage font-black tracking-tighter">Digital Prescription</h3>
                  <p className="text-black/40 font-medium">Schedule precise medication intake for smart push notifications.</p>
                </div>
                <Button 
                  onClick={addMedication}
                  className="rounded-full h-14 px-8 bg-blue-500 hover:bg-blue-600 text-white font-black gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Plus size={20} /> Add Drug
                </Button>
              </div>

              <div className="space-y-6">
                {medications.map((med, index) => (
                  <div key={index} className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-xl relative group">
                    <button 
                      onClick={() => {
                        const newMeds = medications.filter((_, i) => i !== index);
                        setMedications(newMeds);
                        notifyChange({ medications: newMeds });
                      }}
                      className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center text-black/20 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Medication Name</Label>
                        <Input 
                          value={med.name}
                          onChange={(e) => {
                            const newMeds = [...medications];
                            newMeds[index].name = e.target.value;
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          placeholder="e.g. Paracetamol"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Dosage</Label>
                        <Input 
                          value={med.dosage}
                          onChange={(e) => {
                            const newMeds = [...medications];
                            newMeds[index].dosage = e.target.value;
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          placeholder="e.g. 500mg"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5"
                        />
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1 flex items-center gap-2">
                        <Clock size={12} /> Intake Schedule (24h)
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {med.times.map((time, tIdx) => (
                          <div key={tIdx} className="bg-slate-50 rounded-2xl p-1 pr-3 flex items-center gap-2 border border-black/5">
                            <input 
                              type="time"
                              value={time}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[index].times[tIdx] = e.target.value;
                                setMedications(newMeds);
                                notifyChange({ medications: newMeds });
                              }}
                              className="bg-transparent border-none text-xs font-black p-2 outline-none"
                            />
                            {med.times.length > 1 && (
                              <button 
                                onClick={() => {
                                  const newMeds = [...medications];
                                  newMeds[index].times = newMeds[index].times.filter((_, i) => i !== tIdx);
                                  setMedications(newMeds);
                                  notifyChange({ medications: newMeds });
                                }}
                                className="text-black/20 hover:text-rose-500"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newMeds = [...medications];
                            newMeds[index].times.push("12:00");
                            setMedications(newMeds);
                            notifyChange({ medications: newMeds });
                          }}
                          className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Administration Instructions</Label>
                      <Textarea 
                        value={med.instructions}
                        onChange={(e) => {
                          const newMeds = [...medications];
                          newMeds[index].instructions = e.target.value;
                          setMedications(newMeds);
                          notifyChange({ medications: newMeds });
                        }}
                        placeholder="Ex: Take with food. Avoid dairy."
                        className="min-h-[80px] rounded-2xl bg-slate-50 border-none p-4 font-medium text-sm resize-none"
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
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-4xl font-bricolage font-black tracking-tighter">Diagnostic Investigations</h3>
                  <p className="text-black/40 font-medium">Request laboratory tests, imaging, or specialized screenings.</p>
                </div>
                <Button 
                  onClick={addLabRequest}
                  className="rounded-full h-14 px-8 bg-indigo-500 hover:bg-indigo-600 text-white font-black gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Microscope size={20} /> Request Test
                </Button>
              </div>

              <div className="space-y-6">
                {labRequests.map((lab, index) => (
                  <div key={index} className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-xl relative group">
                    <button 
                      onClick={() => {
                        const newLabs = labRequests.filter((_, i) => i !== index);
                        setLabRequests(newLabs);
                        notifyChange({ labRequests: newLabs });
                      }}
                      className="absolute top-8 right-8 p-3 text-black/20 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="grid md:grid-cols-[1fr_200px] gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Test / Investigation Name</Label>
                        <Input 
                          value={lab.testName}
                          onChange={(e) => {
                            const newLabs = [...labRequests];
                            newLabs[index].testName = e.target.value;
                            setLabRequests(newLabs);
                            notifyChange({ labRequests: newLabs });
                          }}
                          placeholder="e.g. Full Blood Count (FBC)"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Urgency</Label>
                        <select 
                          value={lab.urgency}
                          onChange={(e) => {
                            const newLabs = [...labRequests];
                            newLabs[index].urgency = e.target.value as any;
                            setLabRequests(newLabs);
                            notifyChange({ labRequests: newLabs });
                          }}
                          className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold px-5 outline-none appearance-none cursor-pointer"
                        >
                          <option value="ROUTINE">Routine</option>
                          <option value="URGENT">Urgent</option>
                          <option value="STAT">STAT / Immediate</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Preparation Instructions</Label>
                      <Textarea 
                        value={lab.instructions}
                        onChange={(e) => {
                          const newLabs = [...labRequests];
                          newLabs[index].instructions = e.target.value;
                          setLabRequests(newLabs);
                          notifyChange({ labRequests: newLabs });
                        }}
                        placeholder="Ex: Fast for 12 hours before test."
                        className="min-h-[80px] rounded-2xl bg-slate-50 border-none p-4 font-medium text-sm resize-none"
                      />
                    </div>
                  </div>
                ))}

                {labRequests.length === 0 && (
                  <div className="bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-black/5 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
                      <Microscope className="text-indigo-500" size={24} />
                    </div>
                    <p className="font-bold text-black/40">No laboratory investigations requested yet.</p>
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
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-4xl font-bricolage font-black tracking-tighter">Clinical Thresholds</h3>
                  <p className="text-black/40 font-medium">Set targets for the patient to monitor via wearable devices.</p>
                </div>
                <Button 
                  onClick={() => {
                    const newTargets = [...vitalTargets, { label: "", target: "" }];
                    setVitalTargets(newTargets);
                    notifyChange({ vitalTargets: newTargets });
                  }}
                  className="rounded-full h-14 px-8 bg-rose-500 hover:bg-rose-600 text-white font-black gap-2 shadow-lg shadow-rose-500/20"
                >
                  <Plus size={20} /> Add Target
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {vitalTargets.map((v, index) => (
                  <div key={index} className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl relative group">
                    <button 
                      onClick={() => {
                        const newTargets = vitalTargets.filter((_, i) => i !== index);
                        setVitalTargets(newTargets);
                        notifyChange({ vitalTargets: newTargets });
                      }}
                      className="absolute top-6 right-6 p-2 text-black/20 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Metric (e.g. Heart Rate)</Label>
                        <Input 
                          value={v.label}
                          onChange={(e) => {
                            const newTargets = [...vitalTargets];
                            newTargets[index].label = e.target.value;
                            setVitalTargets(newTargets);
                            notifyChange({ vitalTargets: newTargets });
                          }}
                          placeholder="Heart Rate, BP, SpO2..."
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Threshold / Goal</Label>
                        <Input 
                          value={v.target}
                          onChange={(e) => {
                            const newTargets = [...vitalTargets];
                            newTargets[index].target = e.target.value;
                            setVitalTargets(newTargets);
                            notifyChange({ vitalTargets: newTargets });
                          }}
                          placeholder="e.g. < 100 bpm or 120/80"
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {vitalTargets.length === 0 && (
                  <div className="col-span-2 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-black/5 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mb-4">
                      <Gauge className="text-rose-500" size={24} />
                    </div>
                    <p className="font-bold text-black/40">No clinical vital targets set for monitoring.</p>
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
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-4xl font-bricolage font-black tracking-tighter">Holistic Care Advice</h3>
                <p className="text-black/40 font-medium">Guide the patient on lifestyle adjustments for optimal recovery.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { id: "diet", label: "Nutrition & Diet", icon: Coffee, color: "bg-orange-50 text-orange-500", placeholder: "Ex: Low sodium, high fiber diet..." },
                  { id: "exercise", label: "Physical Activity", icon: Dumbbell, color: "bg-emerald-50 text-emerald-500", placeholder: "Ex: Light walking 30min/day..." },
                  { id: "rest", label: "Sleep & Recovery", icon: Moon, color: "bg-indigo-50 text-indigo-500", placeholder: "Ex: 8 hours sleep, avoid stress..." },
                ].map((item) => (
                  <div key={item.id} className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl space-y-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", item.color)}>
                      <item.icon size={24} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">{item.label}</Label>
                      <Textarea 
                        value={(lifestyle as any)[item.id]}
                        onChange={(e) => {
                          const newLife = { ...lifestyle, [item.id]: e.target.value };
                          setLifestyle(newLife);
                          notifyChange({ lifestyle: newLife });
                        }}
                        placeholder={item.placeholder}
                        className="min-h-[120px] rounded-2xl bg-slate-50 border-none p-4 font-medium text-sm resize-none"
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
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-4xl font-bricolage font-black tracking-tighter">Next Milestone</h3>
                <p className="text-black/40 font-medium">Schedule the next check-in or review date.</p>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-2xl max-w-xl">
                 <div className="flex flex-col gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 ml-1 flex items-center gap-2">
                        <Calendar size={12} /> Proposed Follow-up Date
                      </Label>
                      <Input 
                        type="date"
                        value={followUpDate}
                        onChange={(e) => {
                          setFollowUpDate(e.target.value);
                          notifyChange({ followUpDate: e.target.value });
                        }}
                        className="h-16 rounded-2xl bg-slate-50 border-none font-bold px-6 text-lg"
                      />
                    </div>
                    
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                      <Sparkles className="text-emerald-500 shrink-0 mt-1" size={20} />
                      <p className="text-sm font-bold text-emerald-800/80 leading-relaxed uppercase tracking-wider">
                        This will automatically set a reminder in the patient's dashboard and trigger a push notification 24 hours prior.
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
                    const sections = ["diagnosis", "meds", "labs", "vitals", "lifestyle", "followup"];
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
                    const sections = ["diagnosis", "meds", "labs", "vitals", "lifestyle", "followup"];
                    const currIdx = sections.indexOf(activeSection);
                    setActiveSection(sections[currIdx + 1]);
                  }}
                  className="h-14 px-10 bg-black text-white rounded-2xl font-black flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-black/10"
                >
                  Continue <ArrowRight size={18} />
                </Button>
             ) : (
                <div className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                   <Sparkles size={16} className="text-emerald-500" />
                   <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Ready for Final Review</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
