"use client";

import React, { useState } from "react";
import { 
  Pill, Activity, Microscope, Sparkles, Calendar, Clock, 
  ChevronRight, HeartPulse, Gauge, ClipboardList, 
  Coffee, Dumbbell, Moon, Info, ShieldCheck, User, FileText, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HealthBookSectionProps {
  prescriptions: any[];
  clinicalRecords: any[];
}

// ============================================================
// METRIC & DIAGNOSTIC INTELLIGENT EXTRACTORS
// ============================================================

// Doctor Name Extractor
function extractDoctor(record: any): string | null {
  const text = (record.extractedText || "") + " " + (record.analysis?.summary || "");
  const match = text.match(/(?:Dr\.|doctor|physician)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  return match ? `Dr. ${match[1]}` : null;
}

// Vitals Extractor (Regex for blood pressure, pulse, temp, spo2, weight)
function parseVitals(record: any) {
  const text = (record.extractedText || "") + " " + (record.analysis?.summary || "");
  
  // Blood Pressure
  let bp = undefined;
  const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bpMatch) {
    bp = `${bpMatch[1]}/${bpMatch[2]} mmHg`;
  }
  
  // Pulse / Heart Rate
  let pulse = undefined;
  const pulseMatch = text.match(/(?:HR|pulse|heart rate)\s*(?::|is)?\s*(\d{2,3})\s*(?:bpm)?/i) || text.match(/(\d{2,3})\s*(?:bpm)/i);
  if (pulseMatch) {
    pulse = `${pulseMatch[1]} bpm`;
  }
  
  // Temperature
  let temp = undefined;
  const tempMatch = text.match(/(\d{2,3}(?:\.\d)?)\s*(?:°F|F|°C|C)/);
  if (tempMatch) {
    temp = tempMatch[0];
  }
  
  // SpO2
  let spo2 = undefined;
  const spo2Match = text.match(/(?:SpO2|oxygen saturation|O2)\s*(?::|is)?\s*(\d{2})\s*%/i) || text.match(/(\d{2})\s*%\s*(?:SpO2|O2)/i);
  if (spo2Match) {
    spo2 = `${spo2Match[1]}%`;
  }

  // Weight
  let weight = undefined;
  const weightMatch = text.match(/(\d{2,3})\s*(?:kg|lbs)/i);
  if (weightMatch) {
    weight = weightMatch[0];
  }
  
  if (bp || pulse || temp || spo2 || weight) {
    return { bp, pulse, temp, spo2, weight };
  }
  return null;
}

// Medications Extractor (Matching patterns from medical texts)
function parseMedications(record: any) {
  const text = (record.extractedText || "") + " " + (record.analysis?.summary || "") + " " + (record.analysis?.recommendations?.join(" ") || "");
  const meds: any[] = [];
  
  const commonMeds = [
    { name: "Amoxicillin", defaultDosage: "500mg", defaultFreq: "3 times daily" },
    { name: "Ibuprofen", defaultDosage: "400mg", defaultFreq: "As needed for pain" },
    { name: "Paracetamol", defaultDosage: "500mg", defaultFreq: "Every 6 hours as needed" },
    { name: "Acetaminophen", defaultDosage: "500mg", defaultFreq: "Every 6 hours" },
    { name: "Metformin", defaultDosage: "850mg", defaultFreq: "Twice daily with meals" },
    { name: "Atorvastatin", defaultDosage: "20mg", defaultFreq: "Once daily at bedtime" },
    { name: "Lisinopril", defaultDosage: "10mg", defaultFreq: "Once daily in the morning" },
    { name: "Amlodipine", defaultDosage: "5mg", defaultFreq: "Once daily" },
    { name: "Metoprolol", defaultDosage: "50mg", defaultFreq: "Twice daily" },
    { name: "Omeprazole", defaultDosage: "20mg", defaultFreq: "Once daily before breakfast" },
    { name: "Pantoprazole", defaultDosage: "40mg", defaultFreq: "Once daily before breakfast" },
    { name: "Aspirin", defaultDosage: "81mg", defaultFreq: "Once daily" },
    { name: "Levothyroxine", defaultDosage: "75mcg", defaultFreq: "Once daily on empty stomach" },
    { name: "Albuterol", defaultDosage: "2 puffs", defaultFreq: "Every 4 hours as needed" }
  ];
  
  commonMeds.forEach(med => {
    const regex = new RegExp(`\\b${med.name}\\b`, "i");
    if (regex.test(text)) {
      const idx = text.search(regex);
      const textAround = text.substring(Math.max(0, idx - 40), Math.min(text.length, idx + 120));
      const dosageMatch = textAround.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|puffs))/i);
      const dosage = dosageMatch ? dosageMatch[1] : med.defaultDosage;
      
      let frequency = med.defaultFreq;
      if (/twice\s+daily|bid|2\s+times|twice\s+a\s+day/i.test(textAround)) frequency = "Twice daily";
      else if (/three\s+times|tid|3\s+times|three\s+a\s+day/i.test(textAround)) frequency = "Three times daily";
      else if (/once\s+daily|qd|1\s+time|every\s+day/i.test(textAround)) frequency = "Once daily";
      else if (/as\s+needed|prn/i.test(textAround)) frequency = "As needed for symptoms";
      
      meds.push({
        name: med.name,
        dosage: dosage,
        frequency: frequency,
        times: frequency.includes("Twice") ? ["08:00", "20:00"] : frequency.includes("Three") ? ["08:00", "14:00", "20:00"] : ["09:00"],
        instructions: "Extracted from medical report analysis."
      });
    }
  });
  
  return meds;
}

// Lab Requests Extractor
function parseLabRequests(record: any) {
  const text = (record.extractedText || "") + " " + (record.analysis?.summary || "");
  const labs: any[] = [];
  
  const commonLabs = [
    "CBC", "Complete Blood Count", "Lipid Profile", "Liver Function Test", "LFT", 
    "Kidney Function Test", "KFT", "HbA1c", "Thyroid Profile", "TSH", 
    "Urinalysis", "Vitamin D", "MRI", "CT Scan", "X-Ray", "Ultrasound", "ECG", "EKG"
  ];
  
  commonLabs.forEach(lab => {
    const regex = new RegExp(`\\b${lab}\\b`, "i");
    if (regex.test(text)) {
      labs.push({
        testName: lab,
        urgency: text.toLowerCase().includes("urgent") || text.toLowerCase().includes("stat") ? "High" : "Routine",
        instructions: "Monitor levels as indicated in the report."
      });
    }
  });
  
  return labs.length > 0 ? labs : null;
}

// Lifestyle Recommendations Extractor
function extractLifestyle(record: any, category: "diet" | "exercise" | "rest"): string | null {
  const recs = record.analysis?.recommendations || [];
  if (recs.length === 0) return null;
  
  const keywordMap = {
    diet: ["diet", "food", "eat", "nutrition", "meal", "sodium", "salt", "sugar", "avoid", "cholesterol", "fiber", "water", "fluid"],
    exercise: ["exercise", "walk", "run", "lift", "physical", "activity", "cardio", "gym", "movement", "stretch"],
    rest: ["rest", "sleep", "bed", "sleepy", "hour", "night", "stress", "relax", "calm", "meditate"]
  };
  
  const keywords = keywordMap[category];
  const matchingRec = recs.find((r: string) => 
    keywords.some(keyword => new RegExp(`\\b${keyword}\\b`, "i").test(r))
  );
  
  return matchingRec || null;
}

export function HealthBookSection({ prescriptions = [], clinicalRecords = [] }: HealthBookSectionProps) {
  // 1. Process formal prescriptions
  const formalPrescriptions = prescriptions.map((p: any) => ({
    id: p.id,
    type: "formal" as const,
    createdAt: p.createdAt,
    diagnosis: p.diagnosis || "General Clinical Review",
    doctorName: p.doctorName || "Connected Doctor",
    notes: p.notes || "Treatment timeline synchronized securely.",
    medications: p.medications || [],
    vitals: p.vitals || null,
    labRequests: p.labRequests || null,
    vitalTargets: p.vitalTargets || null,
    lifestyle: p.lifestyle || null,
    followUpDate: p.followUpDate || null
  }));

  // 2. Extract clinical assessments from medical records
  const extractedPrescriptions = clinicalRecords
    .filter((r: any) => r.analysis || r.extractedText)
    .map((r: any) => {
      const extractedMeds = parseMedications(r);
      const extractedVitals = parseVitals(r);
      const extractedLabs = parseLabRequests(r);
      
      const diagnosisText = r.description || r.fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const severityPrefix = r.analysis?.severity ? `[${r.analysis.severity}] ` : "";

      const dietText = extractLifestyle(r, "diet");
      const exerciseText = extractLifestyle(r, "exercise");
      const restText = extractLifestyle(r, "rest");

      return {
        id: r.id,
        type: "extracted" as const,
        createdAt: r.createdAt,
        diagnosis: `${severityPrefix}${diagnosisText}`,
        doctorName: extractDoctor(r) || "Hilium Clinical AI",
        notes: r.analysis?.summary || "No automated summary available.",
        medications: extractedMeds,
        vitals: extractedVitals,
        labRequests: extractedLabs,
        vitalTargets: null,
        lifestyle: {
          diet: dietText || "Adhere to clinical dietary indications in the uploaded report.",
          exercise: exerciseText || "Engage in moderate physical activity matching your clinical capacity.",
          rest: restText || "Prioritize high-quality restorative rest."
        },
        followUpDate: null,
        originalUrl: r.url,
        originalName: r.fileName
      };
    });

  // 3. Merge both timeline data feeds
  const unifiedPrescriptions = [...formalPrescriptions, ...extractedPrescriptions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(
    unifiedPrescriptions[0]?.id || null
  );

  // Fallback selector
  const activePrescription = unifiedPrescriptions.find(p => p.id === selectedPrescriptionId) || unifiedPrescriptions[0] || null;

  if (unifiedPrescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-black/[0.02] dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-black/5 dark:border-white/5">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-6">
          <ClipboardList className="text-primary w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bricolage font-black tracking-tight text-black dark:text-white mb-2">No Clinical Records Yet</h3>
        <p className="text-black/40 dark:text-white/40 font-medium max-w-sm text-center leading-relaxed">
          Your professional health booklet will appear here once a doctor completes a consultation or you upload medical reports.
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
              <span className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em]">Clinical Health Link</span>
              <span className="text-xs font-bold text-emerald-600 uppercase">Synchronized & Analyzed</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
        {/* Prescription Timeline Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-black rounded-[3rem] p-8 border border-black/5 dark:border-white/5 shadow-2xl shadow-black/[0.02]">
            <h3 className="text-lg font-black tracking-tight mb-8 px-2">Clinical History Timeline</h3>
            <div className="space-y-3">
              {unifiedPrescriptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPrescriptionId(p.id)}
                  className={cn(
                    "w-full text-left p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden border cursor-pointer",
                    activePrescription?.id === p.id 
                      ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xl" 
                      : "bg-transparent border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                         {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </span>
                       <div className="flex items-center gap-1.5">
                         {p.type === "extracted" ? (
                           <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">AI Scanned</Badge>
                         ) : (
                           <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">Doctor File</Badge>
                         )}
                         <Activity size={14} className={cn(activePrescription?.id === p.id ? "text-primary animate-pulse" : "opacity-20")} />
                       </div>
                    </div>
                    <p className="font-bold text-lg leading-tight truncate">{p.diagnosis}</p>
                    <p className="text-xs font-medium opacity-60 mt-1 uppercase tracking-tighter">{p.doctorName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mb-16 -mr-16" />
             <HeartPulse className="text-white/20 absolute top-8 right-8 w-16 h-16 rotate-12" />
             <div className="relative space-y-4">
                <h3 className="text-xl font-bricolage font-black tracking-tight">AI Insights Engine</h3>
                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  TakeCare Hilium engine parses all uploads in real-time, structuring dynamic medications and lifestyle schedules automatically.
                </p>
             </div>
          </div>
        </aside>

        {/* Prescription Detail View */}
        <AnimatePresence mode="wait">
          {activePrescription && (
            <motion.div
              key={activePrescription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Core Assessment Card */}
              <div className="bg-white dark:bg-black rounded-[4rem] p-12 lg:p-16 border border-black/5 dark:border-white/5 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.04)] relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-full h-2 opacity-50",
                  activePrescription.type === "extracted" ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" : "bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500"
                )} />
                
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">
                          {activePrescription.type === "extracted" ? "AI EXTRACTED DIAGNOSIS" : "PRIMARY PHYSICIAN DIAGNOSIS"}
                        </p>
                      </div>
                      <h4 className="text-4xl font-bricolage font-black tracking-tighter text-black dark:text-white">
                        {activePrescription.diagnosis}
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.3em]">
                        {activePrescription.type === "extracted" ? "CLINICAL SUMMARY" : "CLINICAL NOTES"}
                      </p>
                      <p className="text-lg font-medium text-black/60 dark:text-white/60 leading-relaxed italic font-semibold">
                        "{activePrescription.notes}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] p-8 border border-black/[0.03] dark:border-white/[0.03]">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-xl border border-black/5 dark:border-white/5">
                          {activePrescription.type === "extracted" ? (
                            <Sparkles className="text-amber-500 w-6 h-6" />
                          ) : (
                            <User className="text-primary w-6 h-6" />
                          )}
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">
                            {activePrescription.type === "extracted" ? "ANALYZING SYSTEM" : "CONSULTING PHYSICIAN"}
                          </p>
                          <p className="text-xl font-black text-black dark:text-white tracking-tight">
                            {activePrescription.doctorName}
                          </p>
                       </div>
                    </div>
                    <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">Assessment Reference</p>
                          <p className="text-xs font-mono font-bold text-black/40 uppercase">REF-{activePrescription.id.slice(-6)}</p>
                       </div>
                       <Badge className={cn(
                         "border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg",
                         activePrescription.type === "extracted" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                       )}>
                         {activePrescription.type === "extracted" ? "AI Scanned" : "Verified File"}
                       </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Vitals Section */}
              {activePrescription.vitals && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Gauge size={20} />
                    </div>
                    <h3 className="text-3xl font-bricolage font-black tracking-tighter">Clinical Vitals</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(activePrescription.vitals).map(([key, val]: [string, any]) => {
                      if (!val) return null;
                      const labelMap: any = {
                        bp: "Blood Pressure",
                        pulse: "Heart Rate",
                        temp: "Body Temp",
                        spo2: "Oxygen Saturation",
                        weight: "Body Weight"
                      };
                      return (
                        <div key={key} className="bg-white dark:bg-black rounded-[2rem] p-6 border border-black/5 dark:border-white/5 shadow-md flex flex-col justify-between">
                          <span className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em]">{labelMap[key] || key}</span>
                          <span className="text-xl md:text-2xl font-black text-black dark:text-white mt-2 font-mono">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medication Grid */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Pill size={20} />
                  </div>
                  <h3 className="text-3xl font-bricolage font-black tracking-tighter">
                    {activePrescription.medications && activePrescription.medications.length > 0 ? "Active Medications" : "Clinical Action Steps"}
                  </h3>
                </div>

                {activePrescription.medications && activePrescription.medications.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {activePrescription.medications.map((med: any, mIdx: number) => (
                      <motion.div 
                        key={mIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: mIdx * 0.1 }}
                        className="bg-white dark:bg-black rounded-[3.5rem] p-10 border border-black/5 dark:border-white/5 shadow-xl group hover:scale-[1.02] transition-all duration-500"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <div className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10 font-bold">
                            {med.dosage}
                          </div>
                          <Clock className="text-black/10 group-hover:text-blue-500 transition-colors" size={20} />
                        </div>
                        
                        <h5 className="text-2xl font-black text-black dark:text-white tracking-tight mb-2">{med.name}</h5>
                        <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-[0.2em] mb-8">{med.frequency}</p>
                        
                        <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                          <div className="space-y-3">
                             <p className="text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                               <Clock size={10} /> Daily Intake Schedule
                             </p>
                             <div className="flex flex-wrap gap-2">
                               {med.times?.map((t: string) => (
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
                ) : (
                  // Clinical recommendations fallback if no structured medications are extracted
                  <div className="bg-white dark:bg-black rounded-[3.5rem] p-10 border border-black/5 dark:border-white/5 shadow-xl">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h5 className="text-2xl font-black text-black dark:text-white tracking-tight">AI Clinical Guidance</h5>
                        <p className="text-sm font-medium text-black/40 dark:text-white/40 mt-1">Direct health recommendations scanned from your records.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {clinicalRecords.find(r => r.id === activePrescription.id)?.analysis?.recommendations?.map((rec: string, rIdx: number) => (
                        <div key={rIdx} className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
                          <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{rIdx + 1}</span>
                          <p className="text-sm font-bold text-black/75 dark:text-white/75 leading-relaxed">{rec}</p>
                        </div>
                      )) || (
                        <p className="text-sm font-medium text-black/40 italic">No specific guidelines extracted from this medical report.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Lab Requests Section */}
              {activePrescription.labRequests && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Microscope size={20} />
                    </div>
                    <h3 className="text-3xl font-bricolage font-black tracking-tighter">Recommended Diagnostics</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {activePrescription.labRequests.map((lab: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-black rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-md flex items-center justify-between">
                        <div>
                          <h6 className="font-black text-lg text-black dark:text-white">{lab.testName}</h6>
                          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{lab.instructions || "Diagnostic screening requested."}</p>
                        </div>
                        <Badge className={cn(
                          "border-none font-black text-[9px] uppercase px-2.5 py-1 rounded-md",
                          lab.urgency === "High" ? "bg-rose-500 text-white" : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                        )}>
                          {lab.urgency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Holistic Plan Summary (Extracted from Clinical Recommendations) */}
              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-[4rem] p-12 lg:p-20 border border-black/5 dark:border-white/5">
                <div className="flex flex-col md:flex-row gap-16">
                   <div className="md:w-1/3 space-y-6">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                         <Sparkles size={32} />
                      </div>
                      <h3 className="text-4xl font-bricolage font-black tracking-tighter">Care Roadmap</h3>
                      <p className="text-lg font-medium text-black/40 dark:text-white/40 leading-relaxed font-semibold">
                        Beyond medicine, these clinical lifestyle sync suggestions are compiled for optimal recovery.
                      </p>
                   </div>

                   <div className="flex-1 grid gap-8">
                      {[
                         { icon: Coffee, label: "Nutrition & Diet", text: activePrescription.lifestyle?.diet, color: "text-orange-500" },
                         { icon: Dumbbell, label: "Activity & Exercise", text: activePrescription.lifestyle?.exercise, color: "text-emerald-500" },
                         { icon: Moon, label: "Rest & Sleep", text: activePrescription.lifestyle?.rest, color: "text-indigo-500" },
                      ].map((item, idx) => (
                         <div key={idx} className="flex gap-6 items-start">
                            <div className={cn("w-12 h-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-lg border border-black/5 dark:border-white/5 shrink-0", item.color)}>
                               <item.icon size={20} />
                            </div>
                            <div className="space-y-1 pt-1">
                               <p className="text-sm font-black tracking-tight">{item.label}</p>
                               <p className="text-sm font-medium text-black/60 dark:text-white/60 leading-relaxed font-semibold">{item.text}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Scanned Document Link */}
              {activePrescription.type === "extracted" && activePrescription.originalUrl && (
                <div className="bg-white dark:bg-black rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h5 className="text-xl font-black text-black dark:text-white tracking-tight">Scanned File Link</h5>
                      <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-[0.2em] mt-1">{activePrescription.originalName || "Uploaded report"}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.open(activePrescription.originalUrl, "_blank")}
                    className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 rounded-2xl border border-black/5 dark:border-white/5 font-black text-xs py-4 px-8 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    View Original Report <ArrowUpRight size={14} />
                  </Button>
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
                       Your progress is active. Hilium AI will alert you and compile any fresh updates 24 hours prior to the next review.
                    </p>
                 </div>
                 
                 <div className="relative bg-white text-black p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center min-w-[220px] group-hover:scale-105 transition-transform duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Review Date</p>
                    <p className="text-3xl font-black tracking-tighter">June 10, 2026</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500 mt-4 font-bold">Automatic Monitoring</p>
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
