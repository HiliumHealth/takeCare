"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, FileText, Send, CheckCircle2, ShieldCheck, FileUp, Loader2, XCircle, LogOut, ChevronLeft, Calendar as CalendarIcon, BookOpen, Clock, Activity } from "lucide-react";
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

  useEffect(() => {
    // Force Light Mode for Doctor Dashboard
    document.documentElement.classList.remove('dark');
    
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

  const handleSubmit = async () => {
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
        <div className="max-w-[1600px] mx-auto px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="h-16 w-16 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer" onClick={() => router.push("/")}>
               <img src="/hilium.png" alt="Hilium Logo" className="w-full h-full object-contain" />
            </div>
            <div className="h-8 w-px bg-black/[0.05]" />
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Connected to Patient</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              className="rounded-xl hover:bg-black/5 text-black/30 hover:text-black transition-all"
              onClick={() => {
                localStorage.removeItem("takecare_doctor_invite");
                router.push("/");
              }}
            >
              <LogOut size={16} className="mr-2" />
              <span className="text-[11px] font-black uppercase tracking-widest">Terminate</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-10 mt-10">
        <div className="grid lg:grid-cols-[340px_1fr] gap-12 items-start scale-[0.98] origin-top">
          
          {/* Minimal Patient Context */}
          <aside className="sticky top-28 space-y-8">
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

            <div className="p-6 rounded-3xl bg-black text-white shadow-2xl shadow-black/10">
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
          <div className="bg-white rounded-[2.5rem] border border-black/[0.05] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] p-12 lg:p-16 relative overflow-hidden">
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
                    <h2 className="text-3xl font-bricolage font-black tracking-tighter">Report Sent Successfully!</h2>
                    <p className="text-xs font-medium text-black/40 max-w-xs mx-auto leading-relaxed">
                      The medical report has been saved to the patient's health booklet.
                    </p>
                 </motion.div>
               ) : (
                 <div className="space-y-12">
                   <div className="flex items-center justify-between pb-10 border-b border-black/[0.03]">
                      <div className="space-y-3">
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-black/10 text-black/40 px-3">Case ID: {inviteId.slice(0, 10).toUpperCase()}</Badge>
                         </div>
                         <h1 className="text-3xl font-bricolage font-black tracking-tighter">Clinical Consultation <span className="text-black/30 font-light italic">Report</span></h1>
                      </div>
                      <div className="flex items-center gap-3 px-6 py-3 bg-slate-50/50 rounded-2xl border border-black/[0.03]">
                        <CalendarIcon size={14} className="text-black/20" />
                        <span className="text-xs font-black tracking-tight">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                   </div>

                   <div className="space-y-16">
                     {/* Assessment Section */}
                     <motion.section className="space-y-6">
                       <div className="space-y-1">
                         <h3 className="text-2xl font-bricolage font-black tracking-tighter">Checkup Summary</h3>
                         <p className="text-xs text-black/40 font-medium">Record primary diagnosis and supporting observations.</p>
                       </div>
                       <div className="space-y-4">
                         <div className="space-y-2">
                           <Label className="text-xs font-black uppercase tracking-widest text-black/30">Main Condition Found</Label>
                           <Input 
                             value={formData.diagnosis}
                             onChange={(e) => setFormData((prev: any) => ({ ...prev, diagnosis: e.target.value }))}
                             placeholder="Enter the main diagnosis..."
                             className="h-12 rounded-xl bg-slate-50 border-black/5 text-base font-bold px-4 text-black/90 placeholder:text-black/30"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-xs font-black uppercase tracking-widest text-black/30">Clinical Notes</Label>
                           <Textarea 
                             value={formData.notes}
                             onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                             placeholder="Describe symptoms, findings, and general impressions..."
                             className="min-h-[120px] rounded-2xl bg-slate-50 border-black/5 p-4 font-medium text-sm text-black/90 placeholder:text-black/30"
                           />
                         </div>
                       </div>
                     </motion.section>

                     {/* Prescription Form */}
                     <PrescriptionForm 
                       medications={formData.medications}
                       onMedicationsChange={(meds) => setFormData((prev: any) => ({ ...prev, medications: meds }))}
                       onAddMedication={() => {
                         const newMed = {
                           id: Date.now().toString(),
                           name: "",
                           dosage: "",
                           frequency: "Once Daily" as const,
                           times: ["08:00"],
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

                     {/* Medication Schedule Visualization */}
                     {formData.medications.length > 0 && (
                       <MedicationSchedule 
                         medications={formData.medications}
                         readOnly={true}
                       />
                     )}

                     {/* Follow-up Date */}
                     <motion.section className="space-y-6 pt-8 border-t border-black/5">
                       <div className="space-y-1">
                         <h3 className="text-2xl font-bricolage font-black tracking-tighter flex items-center gap-2">
                           <CalendarIcon className="w-6 h-6 text-emerald-500" />
                           Follow-up Appointment
                         </h3>
                         <p className="text-xs text-black/40 font-medium">Schedule patient's next checkup date.</p>
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs font-black uppercase tracking-widest text-black/30">Follow-up Date</Label>
                         <Input 
                           type="date"
                           value={formData.followUpDate}
                           onChange={(e) => setFormData((prev: any) => ({ ...prev, followUpDate: e.target.value }))}
                           className="h-12 rounded-xl bg-slate-50 border-black/5 font-bold px-4 text-black/90"
                         />
                       </div>
                     </motion.section>
                   </div>

                   <div className="pt-16 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500", isSubmitting ? "animate-pulse" : "opacity-30")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-black/30">{isSubmitting ? "Sending to patient..." : "Ready to send"}</span>
                      </div>
                      <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.diagnosis}
                        className="h-14 px-10 bg-black hover:bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-30"
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
