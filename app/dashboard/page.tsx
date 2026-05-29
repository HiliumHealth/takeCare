"use client";

import { useTheme } from "next-themes";
import React, { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { MessengerSection } from "@/components/dashboard/messenger-section";
import { SmartCareSection } from "@/components/dashboard/smart-care-section";
import { HealthBookSection } from "@/components/dashboard/health-book-section";
import { motion, AnimatePresence } from "framer-motion";
import { getMyMedicalHistory, deleteMedicalRecord, deleteDoctorInvitation } from "@/app/actions/medical";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/dashboard/delete-confirmation-modal";
import { RecordDetailsModal } from "@/components/dashboard/record-details-modal";
import { Input } from "@/components/ui/input";
import { Search, Filter, XCircle, CheckCircle2, BellRing, ArrowRight, ArrowLeft, Bell, Heart, Activity, Pill, ShieldCheck, Loader2, Brain, Sun, Moon, User, FileText, Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/dashboard/mobile-nav";

function DashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic Clinical Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,71,255,0.05),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-16">
        {/* Artistic Central Hub */}
        <div className="relative h-64 w-64 flex items-center justify-center">
          {/* Breathing Aura */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary rounded-full blur-[80px]"
          />

          {/* Orbiting Paths */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute inset-0 border border-primary/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            className="absolute inset-8 border border-emerald-500/10 rounded-full border-dashed"
          />

          {/* Central Perfectly Rounded Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative z-20 h-32 w-32 rounded-full bg-white dark:bg-black shadow-[0_0_50px_rgba(0,71,255,0.15)] flex items-center justify-center border border-primary/10 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src="/hilium.png" alt="Hilium Logo" className="w-16 h-16 object-contain dark:invert" />
            
            {/* Inner Scanning Effect */}
            <motion.div 
              animate={{ top: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-x-0 h-1/2 bg-linear-to-b from-transparent via-primary/10 to-transparent pointer-events-none"
            />
          </motion.div>

          {/* Floating Clinical Elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
              <div className="h-10 w-10 rounded-2xl bg-white dark:bg-[#111] shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute bottom-0 right-1/4 translate-y-4">
              <div className="h-8 w-8 rounded-xl bg-white dark:bg-[#111] shadow-lg border border-black/5 dark:border-white/5 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Textual Narrative */}
        <div className="text-center space-y-6 max-w-sm">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60"
            >
              System Calibration
            </motion.div>
            <h2 className="font-bricolage text-4xl font-black tracking-tight text-black dark:text-white">
              Entering <span className="text-primary italic">Hilium</span>
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* EKG Inspired Pulse Line */}
            <div className="w-48 h-8 relative opacity-30">
               <svg viewBox="0 0 100 20" className="w-full h-full stroke-primary stroke-[0.5] fill-none">
                 <motion.path
                   d="M0 10 L35 10 L40 2 L45 18 L50 10 L100 10"
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: 1 }}
                   transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 />
               </svg>
            </div>
            
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40 flex items-center gap-3">
              <span className="flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="h-1 w-1 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1 w-1 rounded-full bg-primary" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1 w-1 rounded-full bg-primary" />
              </span>
              Clinical Data Synchronization
            </p>
          </div>
        </div>
      </div>

      {/* Trust Signifiers */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {["Vitals", "Lab Records", "Analysis"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-[8px] font-black uppercase tracking-widest px-3 py-1 border border-black/10 dark:border-white/10 rounded-full"
            >
              {item}
            </motion.div>
          ))}
        </div>
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-black/20 dark:text-white/20">End-to-End Encrypted Clinical Vault</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [messengerUnreadCount, setMessengerUnreadCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const userDataRef = useRef<any>(null);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

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

      // Check for status changes to trigger notifications using up-to-date ref
      const currentuserData = userDataRef.current;
      if (currentuserData) {
        const oldInvites = currentuserData.doctorInvitations || [];
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

      // Check for new medical records to trigger a "World-Class" notification using up-to-date ref
      if (currentuserData && currentuserData.medicalRecords) {
        const oldRecordsCount = currentuserData.medicalRecords.length;
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading || status === "loading") return <DashboardLoading />;

  const combinedRecords = [
    ...(userData?.medicalRecords || []),
    ...(userData?.doctorInvitations || []).map((inv: any) => ({
      id: inv.id,
      createdAt: inv.createdAt,
      fileName: `Invite: Dr. ${inv.doctorName}`,
      type: `INVITATION (${inv.platform.toUpperCase()})`,
      url: "#",
      fallbackSummary: 
        inv.status === 'ACCEPTED' ? "Doctor has accepted your invite and is reviewing your records." : 
        inv.status === 'COMPLETED' ? "Professional assessment has been delivered to your health history." :
        inv.status === 'REJECTED' ? "Invitation declined by doctor." :
        "Awaiting Doctor Response",
      analysis: inv.status === 'PENDING' ? undefined : { 
        summary: inv.status === 'ACCEPTED' 
          ? `Status: ACCEPTED. Dr. ${inv.doctorName} is now reviewing your health profile via ${inv.platform}.` 
          : inv.status === 'COMPLETED'
          ? `Status: COMPLETED. Dr. ${inv.doctorName} has finalized your clinical assessment.`
          : `Status: ${inv.status}. Contact Info: ${inv.contactInfo || 'N/A'}`,
        insights: inv.status === 'ACCEPTED' ? ["Secure connection established", "Privacy-first data sharing enabled"] : 
                  inv.status === 'COMPLETED' ? ["Assessment available in history", "Care plan updated"] : []
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-transparent overflow-x-clip max-w-[100vw] lg:pl-[260px]">
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
      <div className="hidden lg:flex sticky top-0 z-30 w-full h-24 bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-b border-black/[0.03] dark:border-white/[0.03] items-center px-10 justify-between">
        <div className="flex items-center gap-8 flex-1">

          <div className="flex items-center gap-4 group bg-transparent px-2 py-3 transition-all w-96">
            <Search className="h-5 w-5 text-black/30 dark:text-white/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search records, doctors, or analysis..." 
              className="bg-transparent border-none focus:ring-0 font-bold text-sm text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-black/20 dark:text-white/20 uppercase tracking-[0.2em]">Profile Status</span>
            <span className="text-xs font-black text-black dark:text-white flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Everything is up to date
            </span>
          </div>
          <div className="h-10 w-px bg-black/[0.05] dark:bg-white/[0.05]" />
          <div className="relative cursor-pointer group" onClick={() => setActiveTab("notifications")}>
            <Bell className="h-6 w-6 text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white transition-colors" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                {unreadNotifications}
              </span>
            )}
          </div>
          <div className="h-6 w-px bg-black/[0.05] dark:bg-white/[0.05]" />
          
          {/* Theme Switcher */}
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-full border border-black/5 bg-black/5 dark:bg-white/5 dark:border-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors group"
          >
            <Sun className="h-5 w-5 text-white/60 group-hover:text-white hidden dark:block" />
            <Moon className="h-5 w-5 text-black/60 group-hover:text-black block dark:hidden" />
          </button>

          {/* User Avatar */}
          <div className="h-10 w-10 rounded-full bg-black/5 border border-black/5 dark:bg-white/5 dark:border-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-md transition-all relative">
            {userData?.avatarUrl || userData?.image ? (
              <>
                <img src={userData?.avatarUrl || userData?.image} alt={userData?.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none" />
              </>
            ) : (
              <User className="h-5 w-5 text-black/40 dark:text-white/40" />
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-md lg:hidden">
        <div className="responsive-container">
          <DashboardHeader user={userData} notificationCount={unreadNotifications} />
        </div>
      </header>


      <main className="flex flex-1 flex-col w-full md:pb-6 px-4 md:px-8 lg:px-10 max-w-none overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-4 flex flex-col gap-6">
                
                {/* Mobile Blue Welcoming Card & Theme-Adaptive Stats (Visible ONLY on mobile) */}
                <div className="block md:hidden w-full space-y-4">
                  <div className="bg-[#0f62fe] text-white rounded-2xl p-4 shadow-md relative overflow-hidden border border-blue-500/20">
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">{getGreeting()}</span>
                      <h1 className="font-bricolage text-lg font-black tracking-tight text-white mt-0.5 leading-none">
                        {userData?.name?.split(' ')[0] || "Patient"}.
                      </h1>
                      <p className="mt-1.5 text-[9px] font-medium text-white/80 leading-normal max-w-[240px]">
                        Your health profile is compiled, verified & secured.
                      </p>
                    </div>
                  </div>

                  <StatsCards stats={{
                    doctorsCount: userData?.doctorInvitations?.length || 0,
                    recordsCount: userData?.medicalRecords?.length || 0,
                    healthScore: userData?.medicalRecords?.length > 0 
                      ? Math.round((userData.medicalRecords.filter((r: any) => r.analysis).length / userData.medicalRecords.length) * 100)
                      : 0
                  }} />
                </div>

                {/* Desktop Welcoming Header & Stats (Visible ONLY on desktop) */}
                <div className="hidden md:flex flex-col gap-6">
                  {/* Clean Welcoming Header */}
                  <div className="flex flex-col items-start text-left pt-4 md:pt-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <h1 className="font-bricolage text-2xl md:text-4xl font-black tracking-tight text-black dark:text-white leading-none">
                      {getGreeting()}, <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{userData?.username || userData?.name?.split(' ')[0] || "Patient"}.</span>
                    </h1>
                    <p className="mt-2 text-xs md:text-sm font-extrabold text-neutral-900 dark:text-neutral-200">
                      Your complete health profile is fully compiled, verified, and secured.
                    </p>
                  </div>

                  <StatsCards stats={{
                    doctorsCount: userData?.doctorInvitations?.length || 0,
                    recordsCount: userData?.medicalRecords?.length || 0,
                    healthScore: userData?.medicalRecords?.length > 0 
                      ? Math.round((userData.medicalRecords.filter((r: any) => r.analysis).length / userData.medicalRecords.length) * 100)
                      : 0
                  }} />
                </div>

                {/* Simplified Search & Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-bricolage text-xl font-black tracking-tight text-black dark:text-white">Clinical History</h2>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">A secure ledger of your compiled medical reports</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-60 shrink-0">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-900 dark:text-neutral-100 group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 pl-10 pr-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0c0c0c] focus:ring-2 focus:ring-primary/10 transition-all font-semibold text-xs placeholder:text-neutral-500 dark:placeholder:text-neutral-400 text-neutral-950 dark:text-white"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-900 dark:text-neutral-100 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={async () => {
                          const { generateHospitalBook } = await import("@/lib/pdf-generator");
                          const url = generateHospitalBook({
                            user: userData,
                            records: userData.medicalRecords,
                            prescriptions: userData.prescriptions,
                            personalization: userData.personalization,
                            preview: true
                          });
                          if (url) window.open(url.toString(), "_blank");
                        }}
                        className="h-10 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-950 dark:text-white border border-neutral-300 dark:border-neutral-700 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                        <span>Preview Booklet</span>
                      </Button>

                      <Button
                        onClick={async () => {
                          const { generateHospitalBook } = await import("@/lib/pdf-generator");
                          generateHospitalBook({
                            user: userData,
                            records: userData.medicalRecords,
                            prescriptions: userData.prescriptions,
                            personalization: userData.personalization
                          });
                          toast.success("Downloading Booklet...", {
                            description: "Compiling and signing your official health ledger.",
                            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          });
                        }}
                        className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs hover:shadow-lg active:scale-98 transition-all flex items-center gap-2 cursor-pointer border-none shrink-0"
                      >
                        <Download className="h-4 w-4 text-white" />
                        <span>Download Booklet</span>
                      </Button>
                    </div>
                  </div>
                </div>


                {searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 w-fit"
                  >
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      Filtered by: "{searchQuery}" — {filteredRecords.length} results
                    </span>
                  </motion.div>
                )}

                <ActivityTable 
                  records={paginatedRecords} 
                  onDelete={handleRecordDeleteClick}
                  onView={handleViewRecord}
                  deletingId={deletingId}
                />

                {/* Professional Pagination Controls */}
                {totalPages > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-6 bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-md rounded-[2rem] border border-black/5 dark:border-white/5 shadow-xs"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/20">Data Navigation</span>
                      <p className="text-xs font-bold text-black/60 dark:text-white/60">
                        Showing <span className="text-black dark:text-white">{Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRecords.length, currentPage * itemsPerPage)}</span> of <span className="text-black dark:text-white">{filteredRecords.length}</span> clinical records
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-black/5 cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                              currentPage === page 
                                ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                                : "text-black/30 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                          >
                            {page.toString().padStart(2, '0')}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-black/5 cursor-pointer"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : activeTab === "health-book" ? (
            <motion.div
              key="health-book"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <HealthBookSection 
                prescriptions={userData?.prescriptions || []} 
                clinicalRecords={userData?.medicalRecords || []}
              />
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
                  invitedDoctors={userData?.doctorInvitations || []}
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
                <SmartCareSection 
                  userName={userData?.name || "Patient"} 
                  initialRecords={userData?.medicalRecords || []}
                />
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
                <h2 className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">Notifications Center</h2>
                <p className="text-xs md:text-sm font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">Real-time health updates and clinical alerts</p>
              </div>

              <div className="flex flex-col gap-4">
                {(userData?.doctorInvitations || []).length > 0 ? (
                  userData.doctorInvitations.map((inv: any, idx: number) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-white dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all"
                    >
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        inv.status === 'ACCEPTED' ? "bg-green-50 dark:bg-green-500/10 text-green-500" : 
                        inv.status === 'REJECTED' ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-black/5 dark:bg-white/10 text-black/20 dark:text-white/40"
                      )}>
                        {inv.status === 'ACCEPTED' ? <CheckCircle2 className="h-6 w-6" /> : 
                         inv.status === 'REJECTED' ? <XCircle className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-black dark:text-white">
                            {inv.status === 'ACCEPTED' ? "Connection Established" : 
                             inv.status === 'REJECTED' ? "Invitation Declined" : "Invitation Pending"}
                          </h4>
                           <span className="text-[10px] font-black text-black/20 dark:text-white/40 uppercase tracking-widest">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-black/50 dark:text-white/60 font-medium">
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
                        className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity dark:text-white"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                   <div className="flex flex-col items-center justify-center py-32 bg-black/2 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-black/10 dark:border-white/10">
                    <Bell className="h-12 w-12 text-black/10 dark:text-white/20 mb-4" />
                    <p className="text-[10px] font-black text-black/30 dark:text-white/40 uppercase tracking-[0.3em]">No alerts at this time</p>
                    <p className="text-xs text-black/10 dark:text-white/20 mt-2 font-bold">New status updates will appear here instantly.</p>
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
