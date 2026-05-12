"use client";

import React, { useState } from "react";
import { 
  Pill, Activity, Microscope, Sparkles, Calendar, Clock, 
  ChevronRight, HeartPulse, Gauge, ClipboardList, 
  Coffee, Dumbbell, Moon, Info, ShieldCheck, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HealthBookSectionProps {
  prescriptions: any[];
  clinicalRecords: any[];
}

export function HealthBookSection({ prescriptions = [], clinicalRecords = [] }: HealthBookSectionProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(prescriptions[0] || null);

  if (prescriptions.length === 0 && clinicalRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-black/[0.02] dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-black/5 dark:border-white/5">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-6">
          <ClipboardList className="text-primary w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bricolage font-black tracking-tight text-black dark:text-white mb-2">No Clinical Records Yet</h3>
        <p className="text-black/40 dark:text-white/40 font-medium max-w-sm text-center leading-relaxed">
          Your professional health booklet will appear here once a doctor completes a consultation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.3em]">
             <ShieldCheck size={14} /> Professional Health Booklet
          </div>
          <h2 className="text-5xl lg:text-7xl font-bricolage font-black tracking-tighter text-black dark:text-white leading-[0.9]">
            Your Clinical <br/><span className="text-black/10 dark:text-white/10 italic">Assessment.</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4 bg-emerald-500/5 px-6 py-4 rounded-3xl border border-emerald-500/10">
           <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em]">Live Clinical Link</span>
              <span className="text-xs font-bold text-emerald-600 uppercase">Synchronized with Doctor</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
        {/* Prescription Timeline / History Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-black rounded-[3rem] p-8 border border-black/5 dark:border-white/5 shadow-2xl shadow-black/[0.02]">
            <h3 className="text-lg font-black tracking-tight mb-8 px-2">Consultation History</h3>
            <div className="space-y-3">
              {prescriptions.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPrescription(p)}
                  className={cn(
                    "w-full text-left p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden border",
                    selectedPrescription?.id === p.id 
                      ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xl" 
                      : "bg-transparent border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                         {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </span>
                       <Activity size={14} className={cn(selectedPrescription?.id === p.id ? "text-primary" : "opacity-20")} />
                    </div>
                    <p className="font-bold text-lg leading-tight truncate">{p.diagnosis}</p>
                    <p className="text-xs font-medium opacity-60 mt-1 uppercase tracking-tighter">Dr. {p.doctorName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mb-16 -mr-16" />
             <HeartPulse className="text-white/20 absolute top-8 right-8 w-16 h-16 rotate-12" />
             <div className="relative space-y-4">
                <h3 className="text-xl font-bricolage font-black tracking-tight">AI Adherence Bot</h3>
                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  Xerine is monitoring your medication intake based on Dr. {selectedPrescription?.doctorName}'s schedule.
                </p>
             </div>
          </div>
        </aside>

        {/* Prescription Detail View */}
        <AnimatePresence mode="wait">
          {selectedPrescription && (
            <motion.div
              key={selectedPrescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Core Assessment Card */}
              <div className="bg-white dark:bg-black rounded-[4rem] p-12 lg:p-16 border border-black/5 dark:border-white/5 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500 opacity-50" />
                
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Primary Diagnosis</p>
                      <h4 className="text-4xl font-bricolage font-black tracking-tighter text-black dark:text-white">
                        {selectedPrescription.diagnosis}
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.3em]">Clinical Notes</p>
                      <p className="text-lg font-medium text-black/60 dark:text-white/60 leading-relaxed italic">
                        "{selectedPrescription.notes}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] p-8 border border-black/[0.03] dark:border-white/[0.03]">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-xl border border-black/5 dark:border-white/5">
                          <User className="text-primary w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Consulting Physician</p>
                          <p className="text-xl font-black text-black dark:text-white tracking-tight">Dr. {selectedPrescription.doctorName}</p>
                       </div>
                    </div>
                    <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Consultation ID</p>
                          <p className="text-xs font-mono font-bold text-black/40 uppercase">REC-{selectedPrescription.id.slice(-6)}</p>
                       </div>
                       <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg">Verified</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medication Grid */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Pill size={20} />
                  </div>
                  <h3 className="text-3xl font-bricolage font-black tracking-tighter">Active Medications</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {selectedPrescription.medications?.map((med: any, mIdx: number) => (
                    <motion.div 
                      key={mIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: mIdx * 0.1 }}
                      className="bg-white dark:bg-black rounded-[3.5rem] p-10 border border-black/5 dark:border-white/5 shadow-xl group hover:scale-[1.02] transition-all duration-500"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10">
                          {med.dosage}
                        </div>
                        <Clock className="text-black/10 group-hover:text-blue-500 transition-colors" size={20} />
                      </div>
                      
                      <h5 className="text-2xl font-black text-black dark:text-white tracking-tight mb-2">{med.name}</h5>
                      <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-[0.2em] mb-8">{med.frequency}</p>
                      
                      <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Clock size={10} /> Daily Intake Times
                           </p>
                           <div className="flex flex-wrap gap-2">
                             {med.times.map((t: string) => (
                               <span key={t} className="px-4 py-2 bg-slate-50 dark:bg-white/[0.03] rounded-xl text-xs font-black border border-black/5 dark:border-white/5">
                                 {t}
                               </span>
                             ))}
                           </div>
                        </div>

                        {med.instructions && (
                          <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/5 dark:border-white/5 flex items-start gap-3">
                            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs font-bold text-black/60 dark:text-white/60 leading-relaxed italic">
                              "{med.instructions}"
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Holistic Plan Summary (Extracted from Clinical Records) */}
              {clinicalRecords.find(r => r.description.includes(selectedPrescription.doctorName)) && (
                <div className="bg-slate-50 dark:bg-white/[0.02] rounded-[4rem] p-12 lg:p-20 border border-black/5 dark:border-white/5">
                  <div className="flex flex-col md:flex-row gap-16">
                     <div className="md:w-1/3 space-y-6">
                        <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                           <Sparkles size={32} />
                        </div>
                        <h3 className="text-4xl font-bricolage font-black tracking-tighter">Holistic Care Roadmap</h3>
                        <p className="text-lg font-medium text-black/40 dark:text-white/40 leading-relaxed">
                          Beyond medicine, your doctor has prescribed these lifestyle adjustments for optimal recovery.
                        </p>
                     </div>

                     <div className="flex-1 grid gap-8">
                        {[
                           { icon: Coffee, label: "Nutrition & Diet", text: "Low sodium, high fiber diet. Avoid caffeine after 4 PM.", color: "text-orange-500" },
                           { icon: Dumbbell, label: "Activity & Exercise", text: "Light morning walks, 20 minutes daily. No heavy lifting.", color: "text-emerald-500" },
                           { icon: Moon, label: "Rest & Sleep", text: "Maintain a strict 10 PM bedtime. 8 hours minimum.", color: "text-indigo-500" },
                        ].map((item, idx) => (
                           <div key={idx} className="flex gap-6 items-start">
                              <div className={cn("w-12 h-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-lg border border-black/5 dark:border-white/5 shrink-0", item.color)}>
                                 <item.icon size={20} />
                              </div>
                              <div className="space-y-1 pt-1">
                                 <p className="text-sm font-black tracking-tight">{item.label}</p>
                                 <p className="text-sm font-medium text-black/40 dark:text-white/40 leading-relaxed">{item.text}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {/* Next Check-in */}
              <div className="bg-emerald-500 rounded-[3rem] p-10 lg:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-emerald-500/30 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                 <div className="relative space-y-4 max-w-xl">
                    <div className="flex items-center gap-3 text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">
                       <Calendar size={12} /> Upcoming Milestone
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-bricolage font-black tracking-tighter leading-none">
                       Next Professional <br/>Review Scheduled.
                    </h3>
                    <p className="text-lg font-medium text-white/60 leading-relaxed">
                       Dr. {selectedPrescription.doctorName} would like to review your progress. Xerine will remind you 24 hours before.
                    </p>
                 </div>
                 
                 <div className="relative bg-white text-black p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center min-w-[220px] group-hover:scale-105 transition-transform duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Review Date</p>
                    <p className="text-3xl font-black tracking-tighter">May 24, 2026</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500 mt-4">Consultation Pending</p>
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
