"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, FileText, Send, CheckCircle2, ShieldCheck, FileUp, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDoctorInvitation } from "@/app/actions/medical";
import { HospitalBookForm, MedicationEntry } from "@/components/doctor/hospital-book-form";

export default function DoctorDashboardPage({ params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = React.use(params);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    diagnosis: "",
    notes: "",
    medications: [],
    labRequests: [],
    vitalTargets: [],
    lifestyle: { diet: "", exercise: "", rest: "" },
    followUpDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getDoctorInvitation(inviteId);
        if (!data) {
          router.push("/doctor/verify");
          return;
        }
        setInvitation(data);
      } catch (error) {
        console.error("Failed to load patient data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [inviteId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Max size is 2MB.`);
          return false;
        }
        return true;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submission = new FormData();
      submission.append("inviteId", inviteId);
      submission.append("diagnosis", formData.diagnosis);
      submission.append("notes", formData.notes);
      submission.append("medications", JSON.stringify(formData.medications));
      submission.append("labRequests", JSON.stringify(formData.labRequests));
      submission.append("vitalTargets", JSON.stringify(formData.vitalTargets));
      submission.append("lifestyle", JSON.stringify(formData.lifestyle));
      submission.append("followUpDate", formData.followUpDate);
      
      selectedFiles.forEach((file) => {
        submission.append("files", file);
      });

      const res = await fetch("/api/doctor/submit-record", {
        method: "POST",
        body: submission,
      });

      if (!res.ok) {
        throw new Error("Failed to submit record");
      }

      setIsSuccess(true);
      setFormData({
        diagnosis: "",
        notes: "",
        medications: [],
        labRequests: [],
        vitalTargets: [],
        lifestyle: { diet: "", exercise: "", rest: "" },
        followUpDate: "",
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
      alert("Failed to submit record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) return null;

  const patient = invitation?.user;
  const latestAnalysis = patient?.medicalRecords?.[0]?.analysis;

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-black selection:text-white">
      {/* Premium Header */}
      <header className="bg-white/70 border-b border-black/[0.03] sticky top-0 z-50 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 group hover:scale-110 transition-transform duration-500 overflow-hidden">
               <img src="/hilium.png" alt="Hilium Logo" className="w-full h-full object-cover p-2" />
            </div>
            <div>
              <h1 className="font-bricolage font-black text-2xl tracking-tighter leading-none">Hilium</h1>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mt-1.5">Clinical Decision Support Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Secure HIPAA Session</span>
             </div>
             <Button 
                variant="ghost" 
                className="h-12 w-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 text-black/40"
                onClick={() => {
                  localStorage.removeItem("takecare_doctor_invite");
                  router.push("/");
                }}
              >
                <XCircle size={20} />
              </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 py-12 grid lg:grid-cols-[380px_1fr] gap-16 items-start">
        
        {/* Patient Profile & Health Twin Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-36">
          <div className="bg-white rounded-[3.5rem] p-10 border border-black/[0.03] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-primary/10 transition-colors duration-700" />
            
            <div className="relative space-y-10">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[3rem] bg-black/5 p-1 border-2 border-white shadow-2xl overflow-hidden">
                    {patient?.avatarUrl ? (
                      <img src={patient.avatarUrl} alt={patient.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-black/10" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-xl">
                     <HeartPulse className="text-white w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-bricolage font-black tracking-tighter text-black">{patient?.name || "Patient Profile"}</h2>
                  <p className="text-sm font-bold text-black/30 uppercase tracking-[0.1em]">{patient?.personalization?.gender || "Biological Male"} • 32 Years Old</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-3xl p-5 border border-black/[0.02]">
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Blood Type</p>
                  <p className="text-lg font-black text-black/70">{patient?.personalization?.bloodType || "O+"}</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-5 border border-black/[0.02]">
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-emerald-500 uppercase">Active</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-black/[0.03]">
                {latestAnalysis && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Digital Twin Insight</p>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-[0.1em] border-none px-2 py-0.5",
                        latestAnalysis.severity === "HIGH" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                      )}>
                        {latestAnalysis.severity || "NORMAL"}
                      </Badge>
                    </div>
                    <div className="p-5 bg-black/[0.02] rounded-[2rem] border border-black/5">
                      <p className="text-xs font-bold text-black/60 leading-relaxed italic">
                        "{latestAnalysis.summary}"
                      </p>
                    </div>
                  </div>
                )}
                
                {patient?.personalization?.allergies?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={10} /> Critical Allergies
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {patient.personalization.allergies.map((allergy: string) => (
                        <span key={allergy} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-100">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-black rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-black/20">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mb-16 -mr-16" />
             <Microscope className="text-white/10 absolute top-10 right-10 w-20 h-20 rotate-12" />
             <div className="relative space-y-4">
                <h3 className="text-xl font-bricolage font-black tracking-tight">Diagnostic Mode</h3>
                <p className="text-sm text-white/50 font-medium leading-relaxed">
                  Your assessment will be used to update the patient's biological model and fine-tune future health predictions.
                </p>
             </div>
          </div>
        </aside>

        {/* Master Consultation Flow */}
        <div className="flex flex-col gap-12">
          <div className="bg-white rounded-[4rem] p-12 lg:p-20 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.06)] border border-black/[0.03] relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500" />
            
            <div className="flex flex-col gap-16">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-black/20 font-black text-xs uppercase tracking-[0.3em]">
                   <ClipboardList size={14} /> Clinical Documentation
                </div>
                <h2 className="text-6xl lg:text-7xl font-bricolage font-black tracking-tighter text-black leading-[0.9]">
                  Comprehensive <br/><span className="text-black/10">Consultation.</span>
                </h2>
                <p className="text-xl font-medium text-black/40 max-w-2xl leading-relaxed mt-6">
                  Fill in the digital health booklet to provide a complete care path for your patient. Every field is synchronized in real-time.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-20">
                <HospitalBookForm onDataChange={(data) => setFormData(data)} />

                {/* Unified Evidence Section */}
                <div className="space-y-10 pt-10 border-t border-black/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <FileUp size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bricolage font-black tracking-tight">Supporting Evidence</h3>
                      <p className="text-sm font-medium text-black/30 uppercase tracking-widest">Supplementary scans and reports</p>
                    </div>
                  </div>

                  <input 
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <div className="grid md:grid-cols-[1fr_300px] gap-8">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black/5 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-6 hover:bg-black/[0.01] transition-all cursor-pointer group bg-slate-50/30"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-700 shadow-xl shadow-black/5">
                        <FileUp className="w-8 h-8 text-black/30" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-lg text-black/80">Upload Diagnostic Files</p>
                        <p className="text-[10px] font-black text-black/20 mt-2 uppercase tracking-[0.2em]">PDF • DICOM • JPG (MAX 2MB)</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <AnimatePresence mode="popLayout">
                          {selectedFiles.map((file, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="bg-white px-6 py-4 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-5 h-5 text-black/20" />
                                <div className="flex flex-col min-w-0">
                                   <span className="text-xs font-black text-black/70 truncate">{file.name}</span>
                                   <span className="text-[9px] font-black text-black/20 uppercase tracking-tighter">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-black/20 hover:bg-rose-50 hover:text-rose-500 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                          ))}
                       </AnimatePresence>
                       {selectedFiles.length === 0 && (
                          <div className="h-full flex items-center justify-center bg-black/[0.02] rounded-[3rem] border border-dashed border-black/5 p-8">
                             <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] text-center">No files attached</p>
                          </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="pt-20 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-12">
                   <div className="flex items-center gap-6">
                      <div className="flex -space-x-3">
                         <div className="w-10 h-10 rounded-full bg-emerald-500 border-4 border-white shadow-lg flex items-center justify-center">
                            <ShieldCheck className="text-white w-4 h-4" />
                         </div>
                         <div className="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
                            <Sparkles className="text-white w-4 h-4" />
                         </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] leading-tight">Digital Signature Active</span>
                        <span className="text-xs font-bold text-black/60 uppercase">Authenticated Session</span>
                      </div>
                   </div>
                   
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.diagnosis.trim()}
                    className="h-24 px-16 bg-black hover:bg-black/90 text-white rounded-[2.5rem] font-black text-xl transition-all shadow-2xl shadow-black/30 disabled:opacity-50 flex items-center gap-5 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Finalizing...
                      </>
                    ) : (
                      <>
                        Complete Consultation <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-3xl px-6"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0, rotate: 5 }}
              className="flex flex-col items-center justify-center gap-10 rounded-[4rem] bg-white p-16 lg:p-24 shadow-2xl border border-white/10 w-full max-w-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500" />
              
              <div className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                <CheckCircle2 className="h-16 w-16 text-white relative z-10" />
              </div>
              
              <div className="space-y-6">
                <h3 className="font-bricolage text-5xl font-black text-black tracking-tighter">Consultation Finalized</h3>
                <p className="text-xl font-medium text-black/40 leading-relaxed">
                  The clinical record has been encrypted and synchronized. The patient has been notified of their new treatment path and upcoming follow-ups.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button 
                  onClick={() => setIsSuccess(false)}
                  className="h-16 rounded-[1.5rem] bg-black text-white font-black text-lg hover:scale-[1.02] transition-transform"
                >
                  New Case
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/doctor/verify")}
                  className="h-16 rounded-[1.5rem] border-black/10 font-black text-lg hover:bg-black/5"
                >
                  Close Portal
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
