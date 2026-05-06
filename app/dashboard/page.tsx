"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { MessengerSection } from "@/components/dashboard/messenger-section";
import { SmartCareSection } from "@/components/dashboard/smart-care-section";
import { motion, AnimatePresence } from "framer-motion";
import { getMyMedicalHistory, deleteMedicalRecord, deleteDoctorInvitation } from "@/app/actions/medical";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/dashboard/delete-confirmation-modal";
import { RecordDetailsModal } from "@/components/dashboard/record-details-modal";
import { Input } from "@/components/ui/input";
import { Search, Filter, XCircle, CheckCircle2, BellRing, ArrowRight, Bell, Heart, Activity, Pill, ShieldCheck, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/dashboard/mobile-nav";

function DashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-vital-orange/5 rounded-full blur-[100px] animate-pulse delay-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Animated Icon Cluster */}
        <div className="relative h-40 w-40 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"
          />

          <motion.div
            animate={{
              rotate: 360,
              borderRadius: ["40%", "50%", "40%"]
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-primary/20"
          />

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="relative z-20 h-24 w-24 bg-white rounded-4xl shadow-2xl flex items-center justify-center border border-primary/10"
          >
            <Heart className="h-10 w-10 text-primary fill-primary/10" />
          </motion.div>

          {/* Floating Orbiting Icons */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute inset-0"
          >
            <motion.div className="absolute -top-4 left-1/2 -translate-x-1/2 h-10 w-10 bg-white rounded-xl shadow-lg border border-black/5 flex items-center justify-center">
              <Pill className="h-5 w-5 text-vital-orange" />
            </motion.div>
            <motion.div className="absolute top-1/2 -right-4 -translate-y-1/2 h-10 w-10 bg-white rounded-xl shadow-lg border border-black/5 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-500" />
            </motion.div>
            <motion.div className="absolute bottom-1/2 -left-4 translate-y-1/2 h-10 w-10 bg-white rounded-xl shadow-lg border border-black/5 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text Section */}
        <div className="text-center space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bricolage text-3xl font-black tracking-tight text-black"
          >
            Loading <span className="text-primary italic">Health Info..</span>
          </motion.h2>

          <div className="flex flex-col items-center gap-2">
            <div className="w-64 h-1.5 bg-black/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-1/2 bg-linear-to-r from-transparent via-primary to-transparent"
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Secure Clinical Data Sync
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex gap-3">
          {["Vitals", "Lab Records", "Medications"].map((status, i) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className="px-4 py-1.5 rounded-full bg-black/5 border border-black/5 text-[9px] font-bold uppercase tracking-widest text-black/40"
            >
              {status}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-2 opacity-20">
        <p className="text-[10px] font-bold tracking-widest uppercase">HIPAA Compliant & End-to-End Encrypted</p>
        <div className="flex gap-4">
          <div className="h-1 w-8 bg-black rounded-full" />
          <div className="h-1 w-8 bg-black rounded-full" />
          <div className="h-1 w-8 bg-black rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [messengerUnreadCount, setMessengerUnreadCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();
  const processedInvitesRef = useRef<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      // Use the secure server action (identifies user via NextAuth session)
      const data = await getMyMedicalHistory();
      
      if (!data) {
         router.push("/signin");
         return;
      }

      // Check for status changes to trigger notifications
      if (userData) {
        const oldInvites = userData.doctorInvitations || [];
        const newInvites = data.doctorInvitations || [];

        newInvites.forEach((newInv: any) => {
          const oldInv = oldInvites.find((o: any) => o.id === newInv.id);
          const inviteKey = `${newInv.id}-${newInv.status}`;

          if (oldInv && oldInv.status === 'PENDING' && newInv.status !== 'PENDING' && !processedInvitesRef.current.has(inviteKey)) {
            processedInvitesRef.current.add(inviteKey);
            
            if (newInv.status === 'ACCEPTED') {
              toast.success(`Dr. ${newInv.doctorName} has accepted your invitation!`, {
                description: "You can now communicate and share records.",
                duration: 5000
              });
              setUnreadNotifications(prev => prev + 1);
            } else if (newInv.status === 'REJECTED') {
              toast.error(`Dr. ${newInv.doctorName} declined the invitation.`);
              setUnreadNotifications(prev => prev + 1);
            }
          }
        });
      }

      // Check for new medical records to trigger a "World-Class" notification
      if (userData && userData.medicalRecords) {
        const oldRecordsCount = userData.medicalRecords.length;
        const newRecordsCount = data.medicalRecords.length;

        if (newRecordsCount > oldRecordsCount) {
          const newRecord = data.medicalRecords[0]; // Assuming records are sorted by date desc
          toast.success("New Clinical Assessment Received!", {
            description: `A new report "${newRecord.fileName}" has been added to your record by your doctor.`,
            duration: 8000,
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          });
          setUnreadNotifications(prev => prev + 1);
        }
      }

      setUserData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    fetchData().finally(() => setTimeout(() => setLoading(false), 2000));

    // Real-time synchronization polling for doctor status updates
    const syncInterval = setInterval(() => {
      fetchData();
    }, 10000); // 10 seconds for a responsive feel

    return () => clearInterval(syncInterval);
  }, [status, router, userData?.doctorInvitations?.length]);

  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; type: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRecordDeleteClick = (e: React.MouseEvent, id: string, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete({ id, type });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, type } = pendingDelete;
    
    // Optimistic Update: Close modal and remove from state immediately
    setDeleteModalOpen(false);
    
    // Save current state in case we need to roll back
    const previousUserData = { ...userData };
    
    // Locally remove the record/invitation from state for instant feedback
    if (userData) {
      if (type.startsWith("INVITATION")) {
        setUserData({
          ...userData,
          doctorInvitations: userData.doctorInvitations.filter((inv: any) => inv.id !== id)
        });
      } else {
        setUserData({
          ...userData,
          medicalRecords: userData.medicalRecords.filter((rec: any) => rec.id !== id)
        });
      }
    }

    setDeletingId(id);
    try {
      if (type.startsWith("INVITATION")) {
        await deleteDoctorInvitation(id);
      } else {
        await deleteMedicalRecord(id);
      }
      toast.success("Record deleted successfully", {
        description: "Your health history has been updated instantly."
      });
      // Silent refresh to ensure data integrity without showing a loader
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete record", {
        description: "The request timed out or was unauthorized. Restoring your data..."
      });
      // Rollback on error
      setUserData(previousUserData);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleViewRecord = (record: any) => {
    setViewingRecord(record);
    setDetailsOpen(true);
  };

  // Scroll to top when active tab changes to ensure visibility of new content
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, loading]);

  if (loading || status === "loading") return <DashboardLoading />;

  const combinedRecords = [
    ...(userData?.medicalRecords || []),
    ...(userData?.doctorInvitations || []).map((inv: any) => ({
      id: inv.id,
      createdAt: inv.createdAt,
      fileName: `Invite: Dr. ${inv.doctorName}`,
      type: `INVITATION (${inv.platform.toUpperCase()})`,
      url: "#",
      fallbackSummary: inv.status === 'ACCEPTED' ? "Doctor has accepted your invite and is reviewing your records." : "Awaiting Doctor Response",
      analysis: inv.status === 'PENDING' ? undefined : { 
        summary: inv.status === 'ACCEPTED' 
          ? `Status: ACCEPTED. Dr. ${inv.doctorName} is now reviewing your health profile via ${inv.platform}.` 
          : `Status: ${inv.status}. Contact Info: ${inv.contactInfo || 'N/A'}`,
        insights: inv.status === 'ACCEPTED' ? ["Secure connection established", "Privacy-first data sharing enabled"] : []
      }
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredRecords = combinedRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.fileName?.toLowerCase().includes(searchLower) ||
      record.type?.toLowerCase().includes(searchLower) ||
      record.analysis?.summary?.toLowerCase().includes(searchLower) ||
      record.fallbackSummary?.toLowerCase().includes(searchLower)
    );
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-transparent overflow-x-clip max-w-[100vw] lg:pl-[280px]">
      {/* Global Modals */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Record?"
        description="Are you sure you want to remove this medical record? This will permanently delete it from your health history and AI context."
      />
      <RecordDetailsModal 
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        record={viewingRecord}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/2 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/2 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      <DashboardSidebar 
        value={activeTab} 
        onValueChange={setActiveTab}
        notificationCount={unreadNotifications}
        messengerCount={messengerUnreadCount}
        user={userData}
      />

      {/* Main Content Area Top Bar - Desktop */}
      <div className="hidden lg:flex sticky top-0 z-30 w-full h-24 bg-white/40 backdrop-blur-3xl border-b border-black/[0.03] items-center px-12 justify-between">
        <div className="flex items-center gap-4 group bg-black/[0.03] px-6 py-3 rounded-2xl border border-transparent focus-within:border-primary/20 transition-all w-96">
          <Search className="h-5 w-5 text-black/30 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, doctors, or analysis..." 
            className="bg-transparent border-none focus:ring-0 font-bold text-sm text-black placeholder:text-black/20 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Profile Status</span>
            <span className="text-xs font-black text-black flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Everything is up to date
            </span>
          </div>
          <div className="h-10 w-px bg-black/[0.05]" />
          <div className="relative cursor-pointer group" onClick={() => setActiveTab("notifications")}>
            <Bell className="h-6 w-6 text-black/40 group-hover:text-black transition-colors" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                {unreadNotifications}
              </span>
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/80 backdrop-blur-md lg:hidden">
        <div className="responsive-container">
          <DashboardHeader user={userData} notificationCount={unreadNotifications} />
        </div>
      </header>


      <main className="flex flex-1 flex-col w-full md:pb-6 px-4 md:px-12 lg:px-16 max-w-none overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 py-6 md:py-8 lg:px-0 lg:py-10 animate-fade-up"
            >
              <h1 className="font-bricolage text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tighter flex flex-wrap items-center gap-x-2 md:gap-x-4 transition-all">
                <span className="text-black/80 whitespace-nowrap">{getGreeting()},</span> 
                <span className="text-black inline-block">{userData?.name?.split(' ')[0] || "Patient"}.</span>
              </h1>
              <p className="mt-3 md:mt-4 text-sm md:text-base lg:text-lg font-semibold text-black/90 max-w-2xl leading-snug md:leading-relaxed">
                Your <span className="text-black font-bold italic underline decoration-primary/40 underline-offset-4 cursor-help">comprehensive health profile</span> is ready.
              </p>
            </motion.div>
          )}
        </AnimatePresence>


        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-6 flex flex-col gap-8">
                <StatsCards stats={{
                  doctorsCount: userData?.doctorInvitations?.length || 0,
                  recordsCount: userData?.medicalRecords?.length || 0,
                  healthScore: userData?.medicalRecords?.length > 0 
                    ? Math.round((userData.medicalRecords.filter((r: any) => r.analysis).length / userData.medicalRecords.length) * 100)
                    : 0
                }} />
                
                {/* Search & Filter Header */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center">
                        <h2 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight text-black">Health History</h2>
                        <div className="flex -space-x-3 overflow-hidden ml-6">
                          {[
                            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=100&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=100&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=100&auto=format&fit=crop"
                          ].map((src, i) => (
                            <img
                              key={i}
                              className="inline-block h-10 w-10 rounded-full ring-[4px] ring-[#f8f9fa] object-cover transition-transform hover:scale-110 cursor-pointer"
                              src={src}
                              alt="Medical Expert"
                            />
                          ))}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-[10px] ring-[4px] ring-[#f8f9fa] transition-all hover:bg-primary hover:text-white cursor-pointer">
                            +12
                          </div>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-black/80 uppercase tracking-widest mt-1">Manage and search your clinical records</p>
                    </div>
                    <div className="relative group w-full md:w-96">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black/20 group-focus-within:text-primary transition-colors">
                        <Search className="h-5 w-5" />
                      </div>
                      <Input
                        placeholder="Search by doctor, date, or clinical diagnosis..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 pr-12 rounded-2xl border-black/5 bg-white shadow-xl shadow-black/5 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-[15px] placeholder:text-black/30 text-black"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-4 flex items-center text-black/60 hover:text-black transition-colors p-2"
                        >
                          <XCircle className="h-5 w-5 fill-black/10" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 w-fit"
                    >
                      <Filter className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Filtered by: "{searchQuery}" — {filteredRecords.length} results
                      </span>
                    </motion.div>
                  )}
                </div>

                <ActivityTable 
                  records={filteredRecords} 
                  onDelete={handleRecordDeleteClick}
                  onView={handleViewRecord}
                  deletingId={deletingId}
                />
              </div>
            </motion.div>
          ) : activeTab === "messenger" ? (
            <motion.div
              key="messenger"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-6 mb-12">
                <MessengerSection 
                  onNotificationSync={setMessengerUnreadCount} 
                  onInviteSuccess={async () => {
                    await fetchData();
                    setActiveTab("overview");
                  }}
                />
              </div>
            </motion.div>
          ) : activeTab === "smart-care" ? (
            <motion.div
              key="smart-care"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-6">
                <SmartCareSection userName={userData?.name || "Patient"} />
              </div>
            </motion.div>
          ) : activeTab === "ai" ? (
            <motion.div
              key="ai-assistant"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="mt-6 px-6 lg:px-0"
            >
              <div className="rounded-[2.5rem] border border-black/5 bg-black/95 p-12 text-center text-white relative overflow-hidden h-[500px] flex flex-col items-center justify-center gap-8 shadow-2xl">
                 <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                 <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                   <Brain className="h-12 w-12 text-primary" />
                 </div>
                 <div className="space-y-4">
                   <h3 className="font-bricolage text-3xl font-black tracking-tight">AI Health Assistant</h3>
                   <p className="text-white/40 font-medium max-w-sm mx-auto">Your personalized diagnostic co-pilot is being calibrated for your health profile.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="px-6 py-3 rounded-2xl bg-white/10 text-[10px] font-black uppercase tracking-widest">Available Q3</div>
                 </div>
              </div>
            </motion.div>
          ) : activeTab === "notifications" ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight text-black">Notifications Center</h2>
                <p className="text-xs md:text-sm font-bold text-black/30 uppercase tracking-widest">Real-time health updates and clinical alerts</p>
              </div>

              <div className="flex flex-col gap-4">
                {(userData?.doctorInvitations || []).length > 0 ? (
                  userData.doctorInvitations.map((inv: any, idx: number) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all"
                    >
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        inv.status === 'ACCEPTED' ? "bg-green-50 text-green-500" : 
                        inv.status === 'REJECTED' ? "bg-red-50 text-red-500" : "bg-black/5 text-black/20"
                      )}>
                        {inv.status === 'ACCEPTED' ? <CheckCircle2 className="h-6 w-6" /> : 
                         inv.status === 'REJECTED' ? <XCircle className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-black">
                            {inv.status === 'ACCEPTED' ? "Connection Established" : 
                             inv.status === 'REJECTED' ? "Invitation Declined" : "Invitation Pending"}
                          </h4>
                          <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-black/50 font-medium">
                          {inv.status === 'ACCEPTED' 
                            ? `Dr. ${inv.doctorName} has accepted your secure clinical invitation. You can now start sharing records.`
                            : inv.status === 'REJECTED'
                            ? `Dr. ${inv.doctorName} was unable to accept your invitation at this time.`
                            : `Awaiting response from Dr. ${inv.doctorName} on ${inv.platform}.`}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setActiveTab("overview")}
                        className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 bg-black/2 rounded-[2.5rem] border border-dashed border-black/10">
                    <Bell className="h-12 w-12 text-black/10 mb-4" />
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">No alerts at this time</p>
                    <p className="text-xs text-black/10 mt-2 font-bold">New status updates will appear here instantly.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-40 text-black/10 font-black uppercase tracking-[0.4em] gap-6"
            >
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-black/5 animate-spin duration-[10s]" />
              Notifications Content Coming Soon
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Bottom padding for mobile nav */}
        <div className="h-32 lg:hidden" />
      </main>

      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        messengerCount={messengerUnreadCount}
        notificationCount={unreadNotifications}
      />
    </div>
  );
}
