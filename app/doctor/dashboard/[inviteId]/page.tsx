"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, FileText, Send, CheckCircle2, ShieldCheck, FileUp, Loader2, XCircle, LogOut, ChevronLeft, Calendar as CalendarIcon, BookOpen, Clock, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDoctorInvitation } from "@/app/actions/medical";
import { PrescriptionForm } from "@/components/doctor/prescription-form";
import { MedicationSchedule } from "@/components/doctor/medication-schedule";

export default function DoctorDashboardPage({ params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = React.use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    diagnosis: "",
    notes: "",
    medications: [],
    labRequests: [],
    vitalTargets: [],
    vitals: { bp: "", pulse: "", temp: "", weight: "", spo2: "" },
    lifestyle: { diet: "", exercise: "", rest: "" },
    followUpDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentTab, setCurrentTab] = useState<"assessment" | "vitals" | "medications" | "labs" | "targets" | "lifestyle" | "followup">("assessment");

  useEffect(() => {
    // Force Light Mode for Doctor Dashboard
    document.documentElement.classList.remove('dark');
    
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getDoctorInvitation(inviteId);
        if (!data) {
          console.error("Doctor invitation not found for inviteId:", inviteId);
          toast.error("Invitation not found", {
            description: "Please verify your credentials again."
          });
          // Give user time to see the error message before redirecting
          setTimeout(() => {
            router.push("/doctor/verify");
          }, 1500);
          return;
        }
        setInvitation(data);
      } catch (error: any) {
        console.error("Failed to load patient data:", error);
        toast.error("Error loading patient data", {
          description: error?.message || "Please try again."
        });
        setTimeout(() => {
          router.push("/doctor/verify");
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (inviteId) {
      loadData();
    }
  }, [inviteId, router]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.diagnosis || !formData.diagnosis.trim()) {
      toast.error("Please enter a diagnosis", {
        description: "The main condition/diagnosis is required to submit the report."
      });
      setCurrentTab("assessment");
      return;
    }

    if (formData.medications.length === 0 || formData.medications.every((m: any) => !m.name?.trim())) {
      toast.error("Please add at least one medication", {
        description: "Add medication details to complete the prescription."
      });
      setCurrentTab("medications");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert medications to API format (remove id, keep only necessary fields)
      const medicationsForAPI = formData.medications.map((med: any) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        times: med.times,
        instructions: med.instructions,
        enableReminders: med.enableReminders ?? true,
        reminderSound: med.reminderSound ?? "soft-bell",
      }));

      const submission = new FormData();
      submission.append("inviteId", inviteId);
      submission.append("diagnosis", formData.diagnosis);
      submission.append("notes", formData.notes);
      submission.append("medications", JSON.stringify(medicationsForAPI));
      submission.append("labRequests", JSON.stringify(formData.labRequests || []));
      submission.append("vitalTargets", JSON.stringify(formData.vitalTargets || []));
      submission.append("vitals", JSON.stringify(formData.vitals));
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit");
      }
      
      toast.success("Report Sent Successfully", {
        description: "Your assessment has been securely added to the patient's record."
      });
      setIsSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error("We couldn't send the report", {
        description: error.message || "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-black/5 border-t-black rounded-full animate-spin" />
          <p className="font-outfit text-xs font-bold uppercase tracking-widest text-black/40">Opening File</p>
        </div>
      </div>
    );
  }

  const patient = invitation?.user;

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-black selection:text-white pb-12">
      {/* Ultra-Clean Minimal Header */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-black/[0.03] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-10">
            <div className="h-12 w-12 md:h-16 md:w-16 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer" onClick={() => router.push("/")}>
               <img src="/hilium.png" alt="Hilium Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden md:block h-8 w-px bg-black/[0.05]" />
            <div className="hidden md:flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Connected to Patient</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Button 
              variant="ghost" 
              className="rounded-lg md:rounded-xl hover:bg-black/5 text-black/30 hover:text-black transition-all cursor-pointer p-2 md:p-3"
              onClick={() => {
                localStorage.removeItem("takecare_doctor_invite");
                router.push("/");
              }}
            >
              <LogOut size={14} className="hidden md:inline mr-2" />
              <LogOut size={16} className="md:hidden" />
              <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">Terminate</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 mt-6 md:mt-10">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 md:gap-10 lg:gap-12 items-start">
          
          {/* Minimal Patient Context */}
          <aside className="sticky top-20 md:top-28 space-y-6 md:space-y-8 hidden lg:block">
            <div className="space-y-6">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-black/5 overflow-hidden ring-4 ring-slate-50/50">
                    {patient?.image ? (
                      <img src={patient.image} alt={patient.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/5">
                        <User className="text-black/20" size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bricolage font-black tracking-tight leading-none">{patient?.name || "Anonymous"}</h2>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-1.5">{patient?.id?.slice(-8).toUpperCase()}</p>
                  </div>
               </div>

               <div className="space-y-2 pt-6 border-t border-black/[0.03]">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Blood Group</span>
                     <span className="text-xs font-black text-rose-500">B RH+</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Age / Gender</span>
                     <span className="text-xs font-black text-black/60">24Y / MALE</span>
                  </div>
               </div>

               <div className="p-5 rounded-2xl bg-slate-50/50 border border-black/[0.03] space-y-3">
                  <span className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] block">Active Allergies</span>
                  <div className="flex flex-wrap gap-2">
                     <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-lg text-[9px] font-black uppercase tracking-tight">Penicillin</Badge>
                     <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-lg text-[9px] font-black uppercase tracking-tight">Pollen</Badge>
                  </div>
               </div>
            </div>

            <div className="p-6 rounded-3xl bg-blue-700 text-white shadow-2xl shadow-black/10">
               <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">Secure Vault</span>
               </div>
               <p className="text-[11px] font-medium leading-relaxed opacity-70">
                 All data points are encrypted and synced to the Hilium Intelligence Network.
               </p>
            </div>
          </aside>

          {/* Clinical Assessment Canvas */}
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-black/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] p-4 md:p-8 lg:p-12 xl:p-16 relative overflow-hidden">
             <AnimatePresence mode="wait">
               {isSuccess ? (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-[600px] flex flex-col items-center justify-center text-center space-y-6"
                 >
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                       <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bricolage font-black tracking-tighter text-black">Report Sent Successfully!</h2>
                    <p className="text-xs md:text-sm font-medium text-black/40 max-w-xs mx-auto leading-relaxed">
                      The medical report has been saved to the patient's health booklet.
                    </p>
                 </motion.div>
               ) : (
                 <div className="space-y-8">
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 md:pb-8 border-b border-black/[0.08]">
                      <div className="space-y-1 md:space-y-2">
                         <h1 className="text-2xl md:text-3xl font-bricolage font-black tracking-tighter text-black">Clinical Consultation</h1>
                         <p className="text-xs text-black/40 font-medium">Case ID: {inviteId.slice(0, 10).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-slate-50/80 rounded-lg md:rounded-2xl border border-black/[0.08] shrink-0">
                        <CalendarIcon size={12} className="md:w-3.5 md:h-3.5 text-black/40" />
                        <span className="text-xs font-black tracking-tight text-black">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                   </div>

                   {/* Tab Navigation */}
                   <div className="flex gap-1 md:gap-2 overflow-x-auto pb-3 md:pb-4 border-b border-black/[0.05] -mx-4 md:mx-0 px-4 md:px-0 md:border-none md:pb-0">
                     {[
                       { id: "assessment", label: "Assessment", icon: "📋" },
                       { id: "vitals", label: "Vital Signs", icon: "❤️" },
                       { id: "medications", label: "Medications", icon: "💊" },
                       { id: "labs", label: "Lab Requests", icon: "🔬" },
                       { id: "targets", label: "Vital Targets", icon: "🎯" },
                       { id: "lifestyle", label: "Care & Lifestyle", icon: "🏃" },
                       { id: "followup", label: "Follow-up", icon: "📅" }
                     ].map((tab) => (
                       <button
                         key={tab.id}
                         onClick={() => setCurrentTab(tab.id as any)}
                         className={cn(
                           "px-2 md:px-4 py-2 md:py-2.5 rounded-lg font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1",
                           currentTab === tab.id
                             ? "bg-black text-white border-black shadow-md"
                             : "bg-slate-50 text-black/60 border-black/[0.08] hover:border-black/20 hover:text-black"
                         )}
                       >
                         <span className="text-sm md:text-base">{tab.icon}</span><span className="hidden md:inline">{tab.label}</span>
                       </button>
                     ))}
                   </div>

                   {/* Tab Content */}
                   <motion.div
                     key={currentTab}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                     className="space-y-6 md:space-y-8"
                   >
                     {/* Assessment Tab */}
                     {currentTab === "assessment" && (
                       <section className="space-y-4 md:space-y-6">
                         <div className="space-y-1 md:space-y-2">
                           <h3 className="text-xl md:text-2xl font-bricolage font-black tracking-tighter text-black">Checkup Summary</h3>
                           <p className="text-xs md:text-sm text-black/40 font-medium">Record primary diagnosis and supporting observations.</p>
                         </div>
                         <div className="space-y-4">
                           <div className="space-y-2 md:space-y-3">
                             <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-black/50">Main Condition Found</Label>
                             <Input 
                               value={formData.diagnosis}
                               onChange={(e) => setFormData((prev: any) => ({ ...prev, diagnosis: e.target.value }))}
                               placeholder="Enter the main diagnosis..."
                               className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white border-2 border-black/40 text-sm md:text-base font-bold px-3 md:px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                             />
                           </div>
                           <div className="space-y-2 md:space-y-3">
                             <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-black/50">Clinical Notes</Label>
                             <Textarea 
                               value={formData.notes}
                               onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                               placeholder="Describe symptoms, findings, and general impressions..."
                               className="min-h-[100px] md:min-h-[120px] rounded-lg md:rounded-2xl bg-white border-2 border-black/40 p-3 md:p-4 font-medium text-sm md:text-base text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                             />
                           </div>
                         </div>
                       </section>
                     )}

                     {/* Vital Signs Tab */}
                     {currentTab === "vitals" && (
                       <section className="space-y-4 md:space-y-6">
                         <div className="space-y-1 md:space-y-2">
                           <h3 className="text-xl md:text-2xl font-bricolage font-black tracking-tighter text-black">Vital Signs</h3>
                           <p className="text-xs md:text-sm text-black/40 font-medium">Record patient vital measurements.</p>
                         </div>
                         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[
                             { key: "bp", label: "Blood Pressure", placeholder: "e.g., 120/80" },
                             { key: "pulse", label: "Pulse (bpm)", placeholder: "e.g., 72" },
                             { key: "temp", label: "Temperature (°C)", placeholder: "e.g., 37.5" },
                             { key: "weight", label: "Weight (kg)", placeholder: "e.g., 70" },
                             { key: "spo2", label: "SPO2 (%)", placeholder: "e.g., 98" }
                           ].map((vital) => (
                             <div key={vital.key} className="space-y-2">
                               <Label className="text-xs font-black uppercase tracking-widest text-black/50">{vital.label}</Label>
                               <Input 
                                 value={formData.vitals[vital.key as keyof typeof formData.vitals]}
                                 onChange={(e) => setFormData((prev: any) => ({ 
                                   ...prev, 
                                   vitals: { ...prev.vitals, [vital.key]: e.target.value } 
                                 }))}
                                 placeholder={vital.placeholder}
                                 className="h-11 rounded-lg bg-white border-2 border-black/40 font-bold px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                               />
                             </div>
                           ))}
                         </div>
                       </section>
                     )}

                     {/* Medications Tab */}
                     {currentTab === "medications" && (
                       <section className="space-y-6">
                         <PrescriptionForm 
                           medications={formData.medications}
                           onMedicationsChange={(meds) => setFormData((prev: any) => ({ ...prev, medications: meds }))}
                           onAddMedication={() => {
                             const newMed = {
                               id: Date.now().toString(),
                               name: "",
                               dosage: "",
                               frequency: "Custom",
                               times: [],
                               instructions: "",
                               enableReminders: true,
                               reminderSound: "soft-bell" as const,
                             };
                             setFormData((prev: any) => ({ 
                               ...prev, 
                               medications: [...prev.medications, newMed] 
                             }));
                           }}
                           onRemoveMedication={(id) => {
                             setFormData((prev: any) => ({ 
                               ...prev, 
                               medications: prev.medications.filter((m: any) => m.id !== id) 
                             }));
                           }}
                         />
                         {formData.medications.length > 0 && (
                           <MedicationSchedule 
                             medications={formData.medications}
                             readOnly={true}
                           />
                         )}
                       </section>
                     )}

                     {/* Lab Requests Tab */}
                     {currentTab === "labs" && (
                       <section className="space-y-6">
                         <div className="space-y-1">
                           <h3 className="text-2xl font-bricolage font-black tracking-tighter text-black">Lab Requests</h3>
                           <p className="text-xs text-black/40 font-medium">Request laboratory tests for patient.</p>
                         </div>
                         <div className="space-y-4">
                           {formData.labRequests && formData.labRequests.length > 0 ? (
                             formData.labRequests.map((lab: any, idx: number) => (
                               <div key={idx} className="p-4 rounded-lg border border-black/[0.08] bg-slate-50/50 space-y-3">
                                 <div className="grid sm:grid-cols-2 gap-3">
                                   <Input 
                                     value={lab.testName}
                                     onChange={(e) => {
                                       const updated = [...formData.labRequests];
                                       updated[idx].testName = e.target.value;
                                       setFormData((prev: any) => ({ ...prev, labRequests: updated }));
                                     }}
                                     placeholder="Test name (e.g., Blood Test)"
                                     className="h-11 rounded-lg bg-white border-2 border-black/40 font-bold px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                                   />
                                   <Input 
                                     value={lab.urgency}
                                     onChange={(e) => {
                                       const updated = [...formData.labRequests];
                                       updated[idx].urgency = e.target.value;
                                       setFormData((prev: any) => ({ ...prev, labRequests: updated }));
                                     }}
                                     placeholder="Urgency (e.g., Routine)"
                                     className="h-11 rounded-lg bg-white border-2 border-black/40 font-bold px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                                   />
                                 </div>
                                 <Textarea 
                                   value={lab.instructions}
                                   onChange={(e) => {
                                     const updated = [...formData.labRequests];
                                     updated[idx].instructions = e.target.value;
                                     setFormData((prev: any) => ({ ...prev, labRequests: updated }));
                                   }}
                                   placeholder="Instructions (e.g., Fasting required)"
                                   className="h-20 rounded-lg bg-white border-2 border-black/40 font-medium px-4 py-3 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10 resize-none"
                                 />
                                 <button
                                   onClick={() => {
                                     setFormData((prev: any) => ({
                                       ...prev,
                                       labRequests: prev.labRequests.filter((_: any, i: number) => i !== idx)
                                     }));
                                   }}
                                   className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                                 >
                                   Remove Test
                                 </button>
                               </div>
                             ))
                           ) : (
                             <div className="text-center py-8 text-black/40">
                               <p className="text-sm font-medium">No lab requests added yet</p>
                             </div>
                           )}
                           <Button
                             onClick={() => {
                               setFormData((prev: any) => ({
                                 ...prev,
                                 labRequests: [...(prev.labRequests || []), { testName: "", urgency: "Routine", instructions: "" }]
                               }));
                             }}
                             className="w-full rounded-lg h-11 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                           >
                             <Plus size={16} /> Add Lab Request
                           </Button>
                         </div>
                       </section>
                     )}

                     {/* Vital Targets Tab */}
                     {currentTab === "targets" && (
                       <section className="space-y-6">
                         <div className="space-y-1">
                           <h3 className="text-2xl font-bricolage font-black tracking-tighter text-black">Vital Targets</h3>
                           <p className="text-xs text-black/40 font-medium">Set target vital sign goals for patient.</p>
                         </div>
                         <div className="space-y-4">
                           {formData.vitalTargets && formData.vitalTargets.length > 0 ? (
                             formData.vitalTargets.map((target: any, idx: number) => (
                               <div key={idx} className="p-4 rounded-lg border border-black/[0.08] bg-slate-50/50 space-y-3">
                                 <div className="grid sm:grid-cols-2 gap-3">
                                   <Input 
                                     value={target.label}
                                     onChange={(e) => {
                                       const updated = [...formData.vitalTargets];
                                       updated[idx].label = e.target.value;
                                       setFormData((prev: any) => ({ ...prev, vitalTargets: updated }));
                                     }}
                                     placeholder="Target name (e.g., BP)"
                                     className="h-11 rounded-lg bg-white border-2 border-black/40 font-bold px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                                   />
                                   <Input 
                                     value={target.target}
                                     onChange={(e) => {
                                       const updated = [...formData.vitalTargets];
                                       updated[idx].target = e.target.value;
                                       setFormData((prev: any) => ({ ...prev, vitalTargets: updated }));
                                     }}
                                     placeholder="Target value (e.g., <130/80)"
                                     className="h-11 rounded-lg bg-white border-2 border-black/40 font-bold px-4 text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10"
                                   />
                                 </div>
                                 <button
                                   onClick={() => {
                                     setFormData((prev: any) => ({
                                       ...prev,
                                       vitalTargets: prev.vitalTargets.filter((_: any, i: number) => i !== idx)
                                     }));
                                   }}
                                   className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                                 >
                                   Remove Target
                                 </button>
                               </div>
                             ))
                           ) : (
                             <div className="text-center py-8 text-black/40">
                               <p className="text-sm font-medium">No vital targets added yet</p>
                             </div>
                           )}
                           <Button
                             onClick={() => {
                               setFormData((prev: any) => ({
                                 ...prev,
                                 vitalTargets: [...(prev.vitalTargets || []), { label: "", target: "" }]
                               }));
                             }}
                             className="w-full rounded-lg h-11 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                           >
                             <Plus size={16} /> Add Vital Target
                           </Button>
                         </div>
                       </section>
                     )}

                     {/* Care & Lifestyle Tab */}
                     {currentTab === "lifestyle" && (
                       <section className="space-y-6">
                         <div className="space-y-1">
                           <h3 className="text-2xl font-bricolage font-black tracking-tighter text-black">Care & Lifestyle</h3>
                           <p className="text-xs text-black/40 font-medium">Provide lifestyle and care recommendations.</p>
                         </div>
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <Label className="text-xs font-black uppercase tracking-widest text-black/50">Diet Recommendations</Label>
                             <Textarea 
                               value={formData.lifestyle.diet}
                               onChange={(e) => setFormData((prev: any) => ({ 
                                 ...prev, 
                                 lifestyle: { ...prev.lifestyle, diet: e.target.value } 
                               }))}
                               placeholder="e.g., Avoid salt, increase fiber intake..."
                               className="h-24 rounded-lg bg-white border-2 border-black/40 p-4 font-medium text-sm text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10 resize-none"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-xs font-black uppercase tracking-widest text-black/50">Exercise & Activity</Label>
                             <Textarea 
                               value={formData.lifestyle.exercise}
                               onChange={(e) => setFormData((prev: any) => ({ 
                                 ...prev, 
                                 lifestyle: { ...prev.lifestyle, exercise: e.target.value } 
                               }))}
                               placeholder="e.g., 30 mins walking daily, avoid strenuous activity..."
                               className="h-24 rounded-lg bg-white border-2 border-black/40 p-4 font-medium text-sm text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10 resize-none"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-xs font-black uppercase tracking-widest text-black/50">Rest & Sleep</Label>
                             <Textarea 
                               value={formData.lifestyle.rest}
                               onChange={(e) => setFormData((prev: any) => ({ 
                                 ...prev, 
                                 lifestyle: { ...prev.lifestyle, rest: e.target.value } 
                               }))}
                               placeholder="e.g., 7-8 hours sleep, avoid stress..."
                               className="h-24 rounded-lg bg-white border-2 border-black/40 p-4 font-medium text-sm text-black placeholder:text-black/50 focus:border-black/60 focus:ring-2 focus:ring-black/10 resize-none"
                             />
                           </div>
                         </div>
                       </section>
                     )}

                     {/* Follow-up Tab */}
                     {currentTab === "followup" && (
                       <section className="space-y-6">
                         <div className="space-y-1">
                           <h3 className="text-2xl font-bricolage font-black tracking-tighter text-black">Follow-up Appointment</h3>
                           <p className="text-xs text-black/40 font-medium">Schedule patient's next checkup date.</p>
                         </div>
                         <div className="space-y-2">
                           <Label className="text-xs font-black uppercase tracking-widest text-black/50">Follow-up Date</Label>
                           <Input 
                             type="date"
                             value={formData.followUpDate}
                             onChange={(e) => setFormData((prev: any) => ({ ...prev, followUpDate: e.target.value }))}
                             className="h-12 rounded-xl bg-white border-2 border-black/40 font-bold px-4 text-black focus:border-black/60 focus:ring-2 focus:ring-black/10"
                           />
                         </div>
                       </section>
                     )}
                   </motion.div>

                   <div className="pt-6 md:pt-8 border-t border-black/[0.08] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500", isSubmitting ? "animate-pulse" : "opacity-30")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-black/40">{isSubmitting ? "Sending to patient..." : "Ready to send"}</span>
                      </div>
                      <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.diagnosis || formData.medications.length === 0 || formData.medications.every((m: any) => !m.name?.trim())}
                        className="h-14 px-10 bg-black hover:bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-30 cursor-pointer"
                      >
                        {isSubmitting ? "Sending..." : "Send to Patient"}
                        <Send size={16} className="ml-3" />
                      </Button>
                   </div>
                 </div>
               )}
             </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
