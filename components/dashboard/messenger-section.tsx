"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Phone, UserPlus, ArrowRight, CheckCircle2, Bell, BellRing, Settings, MoreVertical, Paperclip, Smile, Mic, Mail, X, ArrowUp, Plus, Wrench, QrCode, Zap, ShieldCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "fast", label: "Fast Mode", icon: Zap, color: "text-sky-500", bg: "bg-sky-500/10", desc: "Instant QR Scan" },
  { id: "secure", label: "Secure Mode", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Encrypted Gmail Link" },
  { id: "select", label: "Choose Doctor", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10", desc: "One-Click Quick Invite" },
];

const POPULAR_DOCTORS = [
  {
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@takecare.com",
    specialty: "Chief of Cardiology",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Dr. Paul Ndip",
    email: "paul.ndip@takecare.com",
    specialty: "General Practitioner",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Dr. Augustin Fonyuy",
    email: "augustin.fonyuy@takecare.com",
    specialty: "General Practitioner",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Dr. Fien Clarisse",
    email: "fien.clarisse@takecare.com",
    specialty: "Consultant Pediatrician",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Dr. Amos Vernsyuy",
    email: "amos.vernsyuy@takecare.com",
    specialty: "Senior Neurologist",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"
  }
];

const getSpecialtyBadgeStyles = (specialty: string) => {
  const spec = specialty.toLowerCase();
  if (spec.includes("cardio")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  if (spec.includes("pediat")) return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
  if (spec.includes("neuro")) return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  if (spec.includes("general") || spec.includes("practitioner")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
};

const getRealDoctorAvatar = (name: string) => {
  const images = [
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1582750433449-649350146c42?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=150",
    "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=150"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor";
  timestamp: string;
  type?: string;     // text, image, voice, audio, video
  mediaUrl?: string; // URL for the media
}

export function MessengerSection({ onNotificationSync, onInviteSuccess, invitedDoctors }: { onNotificationSync?: (count: number) => void; onInviteSuccess?: () => void; invitedDoctors?: any[]; }) {
  const [mode, setMode] = useState("fast");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | null>(new Date().toISOString());
  const scrollRef = useRef<HTMLDivElement>(null);

  const [myDoctors, setMyDoctors] = useState<any[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("takecare_my_doctors");
      if (saved) {
        // Hydrate saved doctors but ensure their avatars use the new high-fidelity real doctor images dynamically!
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((doc: any) => ({
          ...doc,
          avatar: getRealDoctorAvatar(doc.name)
        }));
        setMyDoctors(hydrated);
      }
    }
  }, []);

  const saveDoctorToMyDoctors = (name: string, email: string) => {
    const avatar = getRealDoctorAvatar(name);
    const specialty = "Private Practitioner";
    const newDoc = { name, email, specialty, avatar };
    
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("takecare_my_doctors");
      let currentDocs = saved ? JSON.parse(saved) : [];
      
      const exists = currentDocs.some((d: any) => d.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (!exists) {
        currentDocs.push(newDoc);
        localStorage.setItem("takecare_my_doctors", JSON.stringify(currentDocs));
        setMyDoctors(currentDocs.map((d: any) => ({ ...d, avatar: getRealDoctorAvatar(d.name) })));
      }
    }
  };

  const handleAutoInvite = async (name: string, email: string) => {
    setIsSubmitting(true);
    setDoctorName(name);
    setContactInfo(email);
    
    saveDoctorToMyDoctors(name, email);

    try {
      const endpoint = `/api/messenger/gmail`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: email,
          contactInfo: email, 
          contactName: name,
          doctorName: name,
          initialMessage: `Connection request automatically sent via secure link.`,
          platform: "gmail", 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsInvited(true);
        setIsPopupOpen(false);
        setTimeout(() => {
          setIsInvited(false);
          setDoctorName("");
          setContactInfo("");
          setInitialMessage("");
          
          if (onInviteSuccess) {
            onInviteSuccess();
          } else {
            setIsChatActive(true);
          }
        }, 1500);
      } else {
        alert(`WhatsApp Delivery Error: ${result.error}. Check campaign: ${process.env.NEXT_PUBLIC_CAMPAIGN || 'health_check'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Could not reach communication gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const combinedDoctors = React.useMemo(() => {
    const list = [...myDoctors];
    if (invitedDoctors && Array.isArray(invitedDoctors)) {
      invitedDoctors.forEach((inv: any) => {
        const exists = list.some(
          (d: any) => d.email.toLowerCase().trim() === inv.contactInfo.toLowerCase().trim()
        );
        if (!exists) {
          list.push({
            name: inv.doctorName,
            email: inv.contactInfo,
            specialty: inv.status === "ACCEPTED" ? "Your Connected Doctor" : "Invitation Pending",
            avatar: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(inv.doctorName)}`
          });
        }
      });
    }
    return list;
  }, [myDoctors, invitedDoctors]);

  const filteredPopularDoctors = POPULAR_DOCTORS.filter(doc => 
    doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    doc.email.toLowerCase().includes(doctorSearchQuery.toLowerCase())
  );

  const filteredMyDoctors = combinedDoctors.filter(doc => 
    doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    doc.email.toLowerCase().includes(doctorSearchQuery.toLowerCase())
  );

  // Sync with parent
  useEffect(() => {
    if (onNotificationSync) {
      onNotificationSync(notificationCount);
    }
  }, [notificationCount, onNotificationSync]);

  const clearNotifications = () => {
    setNotificationCount(0);
    if (onNotificationSync) onNotificationSync(0);
  };

  // Sound Notification
  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3"); // Simple ping
    audio.play().catch(e => console.log("Sound error:", e));
  };

  // Real-time Polling for new doctor messages (Multi-modal)
  useEffect(() => {
    if (!isChatActive) return;

    const pollInterval = setInterval(async () => {
      try {
        const url = `/api/messenger/check?lastSeen=${lastSeenTimestamp || ""}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.messages.length > 0) {
          const incoming = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: "doctor",
            timestamp: m.timestamp,
            type: m.type,
            mediaUrl: m.mediaUrl
          }));

          setMessages(prev => [...prev, ...incoming]);
          setNotificationCount(n => n + data.messages.length);
          setLastSeenTimestamp(data.latestTimestamp);
          playNotificationSound();

          console.log("[FAANG Ingestion] Multi-modal Data Ready for AI:", incoming);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000); // Faster polling for real-time feel

    return () => clearInterval(pollInterval);
  }, [isChatActive, lastSeenTimestamp]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    let formattedNumber = contactInfo; 
    setIsSubmitting(true);

    saveDoctorToMyDoctors(doctorName, contactInfo);

    try {
      const endpoint = `/api/messenger/gmail`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: formattedNumber,
          contactInfo: formattedNumber, 
          contactName: doctorName,
          doctorName: doctorName,
          initialMessage: initialMessage,
          platform: "gmail", 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsInvited(true);
        setIsPopupOpen(false);
        setTimeout(() => {
          setIsInvited(false);
          setDoctorName("");
          setContactInfo("");
          setInitialMessage("");
          
          if (onInviteSuccess) {
            onInviteSuccess();
          } else {
            setIsChatActive(true);
          }
        }, 1500);
      } else {
        alert(`WhatsApp Delivery Error: ${result.error}. Check campaign: ${process.env.NEXT_PUBLIC_CAMPAIGN || 'health_check'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Could not reach communication gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="px-0 lg:px-12 mt-4 flex flex-col gap-8 relative">
      <div className="flex justify-between items-center mb-2 lg:mb-4">
        <h2 className="text-xl lg:text-3xl font-bricolage font-black tracking-tighter dark:text-white">Care Center</h2>
        <div className="relative group cursor-pointer" onClick={clearNotifications}>
          <div className="p-2 lg:p-3 bg-white/50 backdrop-blur-md rounded-xl lg:rounded-2xl border border-black/5 shadow-sm group-hover:bg-white transition-all">
            {notificationCount > 0 ? (
              <BellRing className="w-5 h-5 lg:w-6 lg:h-6 text-red-500 animate-bounce" />
            ) : (
              <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-black/40" />
            )}
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] lg:text-[10px] font-bold px-1.5 lg:py-0.5 rounded-full shadow-lg border-2 border-white">
                {notificationCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isChatActive ? (
        <div className="w-full">
          <div className="bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-full lg:w-fit flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-1 transition-colors flex-nowrap shrink-0">
            {MODES.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  setIsPopupOpen(true);
                }}
                className={cn(
                  "rounded-xl px-4 sm:px-6 py-2.5 transition-all duration-300 cursor-pointer flex-1 lg:flex-none flex items-center justify-center gap-2 font-outfit font-bold text-xs sm:text-sm whitespace-nowrap shrink-0",
                  "hover:bg-white dark:hover:bg-white/10 hover:shadow-sm text-black/80 dark:text-white focus:outline-none active:scale-95",
                  mode === m.id ? "bg-white dark:bg-white/10 shadow-sm" : ""
                )}
              >
                <m.icon className={cn("h-4 w-4 transition-colors shrink-0", m.color)} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Creative Display Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-2 relative w-full h-[450px] md:h-[550px] overflow-hidden flex items-end justify-center pb-8"
          >
            {/* The Image Area with Radial Mask to perfectly hide sharp edges */}
            <div 
              className="absolute inset-0 w-full h-full z-0 pointer-events-none"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              }}
            >
              <motion.img 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                src="https://i.ibb.co/Y77ZSmfz/Chat-GPT-Image-Apr-16-2026-08-45-07-AM.png"
                alt="AI Health Communication"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Glowing orb to slightly highlight the text box area */}
            <div className="absolute bottom-8 bg-white/70 w-[80%] max-w-sm h-24 rounded-full blur-[30px] z-0" />

            {/* Floating Horizontal Glass Box pushed to the bottom so the image is fully visible */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative z-10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/20 p-4 rounded-[28px] shadow-xl w-[90%] max-w-sm flex items-center gap-4 group cursor-default"
            >
              <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <MessageCircle className="text-primary group-hover:text-white w-5 h-5 transition-colors" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bricolage text-[16px] font-black text-black dark:text-white tracking-tight leading-none mb-1">Sync & Send</h3>
                <p className="text-black/60 dark:text-white/60 font-medium text-[11px] leading-relaxed">
                  Link your preferred messenger and start health analysis instantly.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {isPopupOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 cursor-pointer"
                onClick={() => setIsPopupOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full sm:max-w-3xl bg-white dark:bg-[#0a0a0a] rounded-t-[40px] sm:rounded-[36px] max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative cursor-default transition-colors duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="absolute top-6 right-6 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors z-10 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-black/60 dark:text-white/60" />
                  </button>

                  {(() => {
                    const m = MODES.find(md => md.id === mode) || MODES[0];
                    return (
                      <div className="flex flex-col gap-8 relative overflow-hidden mt-2">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                        <div className="flex flex-col gap-8">
                          <div className="flex items-center gap-6">
                            <div className={cn("relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl shadow-xl", m.bg)}>
                              <m.icon className={cn("h-10 w-10", m.color)} />
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bricolage text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight dark:text-white">
                                {m.label}
                              </h3>
                              <p className="text-sm font-medium text-black/40 dark:text-white/40">
                                {m.desc}
                              </p>
                            </div>
                          </div>

                          {mode === "fast" ? (
                            <div className="flex flex-col items-center justify-center py-8 z-10">
                              <div className="bg-white p-4 rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-black/5 flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-blue-500/10 rounded-[32px] blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                                <img 
                                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://takecare-doctor.vercel.app/dashboard/patient/scan&margin=20" 
                                  alt="Secure QR Code" 
                                  className="w-56 h-56 rounded-2xl mix-blend-multiply relative z-10 pointer-events-none" 
                                />
                                <div className="absolute top-4 left-4 right-4 h-0.5 bg-blue-500 z-20 shadow-[0_0_15px_rgba(59,130,246,0.8)] opacity-70 animate-[scan_2s_ease-in-out_infinite]" />
                              </div>
                              <p className="text-sm font-bold text-black/50 dark:text-white/50 mt-8 max-w-xs text-center leading-relaxed">
                                Doctor scans this code to instantly securely access your Hilium Dossier.
                              </p>
                              
                              {combinedDoctors.length > 0 && (
                                <div className="w-full max-w-sm mt-6">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 text-left">
                                    Quick Select from My Doctors
                                  </div>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {combinedDoctors.slice(0, 3).map((doc, idx) => (
                                      <button
                                        type="button"
                                        key={`fast-my-${idx}`}
                                        onClick={() => handleAutoInvite(doc.name, doc.email)}
                                        className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-2 pr-3 hover:bg-primary/10 transition-all cursor-pointer shrink-0"
                                      >
                                        <img src={doc.avatar} className="w-6 h-6 rounded-lg object-cover" />
                                        <span className="text-xs font-bold text-black dark:text-white truncate max-w-[80px]">{doc.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Button 
                                onClick={() => {
                                  setIsPopupOpen(false);
                                  setIsChatActive(true);
                                }}
                                className="mt-8 h-14 px-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-black hover:scale-105 active:scale-95 shadow-xl transition-all cursor-pointer"
                              >
                                Simulate Scan
                              </Button>
                              <style>{`
                                @keyframes scan {
                                  0%, 100% { top: 1rem; }
                                  50% { top: calc(100% - 1rem); }
                                }
                              `}</style>
                            </div>
                          ) : mode === "select" ? (
                            <div className="flex flex-col gap-6 z-10 py-2">
                              {/* Search Input for Quick Filtering */}
                              <div className="relative">
                                <Input
                                  placeholder="Search by name, specialization, or email..."
                                  value={doctorSearchQuery}
                                  onChange={(e) => setDoctorSearchQuery(e.target.value)}
                                  className="h-12 sm:h-14 rounded-3xl border-black/5 bg-black/5 dark:bg-white/5 pl-12 text-sm font-bold transition-all focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary/5 shadow-inner text-black dark:text-white"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                              </div>

                              {/* Conditionally Render My Doctors Section */}
                              {filteredMyDoctors.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 pl-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    My Connected Doctors ({filteredMyDoctors.length})
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 bg-black/5 dark:bg-white/10 gap-[1px] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto pr-[1px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full shadow-inner">
                                    {filteredMyDoctors.map((doc, idx) => (
                                      <motion.div
                                        key={`my-${doc.email}-${idx}`}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleAutoInvite(doc.name, doc.email)}
                                        className="bg-white dark:bg-[#0c0c0c] p-3 aspect-square flex flex-col items-center justify-between text-center transition-all duration-300 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] cursor-pointer group relative overflow-hidden"
                                      >
                                        <span className={cn("text-[7.5px] font-black tracking-wider uppercase px-2 py-0.5 rounded border shrink-0 truncate max-w-full font-outfit", getSpecialtyBadgeStyles(doc.specialty))}>
                                          {doc.specialty}
                                        </span>

                                        <div className="relative w-11 h-11 rounded-xl border border-black/5 dark:border-white/10 p-0.5 group-hover:scale-105 group-hover:border-primary transition-all duration-500 bg-white dark:bg-black/30 shrink-0">
                                          <img src={doc.avatar} alt={doc.name} className="w-full h-full rounded-lg object-cover" />
                                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0c0c0c] shadow-sm animate-pulse" />
                                        </div>

                                        <div className="w-full flex flex-col items-center gap-0.5 min-w-0">
                                          <h5 className="font-bricolage text-[11px] sm:text-xs font-black tracking-tight text-black dark:text-white leading-tight group-hover:text-primary transition-colors truncate w-full">
                                            {doc.name}
                                          </h5>
                                          <p className="text-[8.5px] text-black/40 dark:text-white/40 font-bold font-outfit truncate w-full">
                                            {doc.email}
                                          </p>
                                        </div>

                                        <div className="text-[8px] font-black uppercase tracking-wider text-black/40 dark:text-white/40 group-hover:text-primary transition-colors flex items-center justify-center gap-0.5 shrink-0 mt-1">
                                          <span>Connect</span>
                                          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-all text-black/40 dark:text-white/40 group-hover:text-primary" />
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preset/Popular Doctors Section */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 pl-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  Popular Doctors
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 bg-black/5 dark:bg-white/10 gap-[1px] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto pr-[1px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full shadow-inner">
                                  {filteredPopularDoctors.map((doc, idx) => (
                                    <motion.div
                                      key={`popular-${doc.email}-${idx}`}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => handleAutoInvite(doc.name, doc.email)}
                                      className="bg-white dark:bg-[#0c0c0c] p-3 aspect-square flex flex-col items-center justify-between text-center transition-all duration-300 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] cursor-pointer group relative overflow-hidden"
                                    >
                                      <span className={cn("text-[7.5px] font-black tracking-wider uppercase px-2 py-0.5 rounded border shrink-0 truncate max-w-full font-outfit", getSpecialtyBadgeStyles(doc.specialty))}>
                                        {doc.specialty}
                                      </span>

                                      <div className="relative w-11 h-11 rounded-xl border border-black/5 dark:border-white/10 p-0.5 group-hover:scale-105 group-hover:border-primary transition-all duration-500 bg-white dark:bg-black/30 shrink-0">
                                        <img src={doc.avatar} alt={doc.name} className="w-full h-full rounded-lg object-cover" />
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0c0c0c] shadow-sm animate-pulse" />
                                      </div>

                                      <div className="w-full flex flex-col items-center gap-0.5 min-w-0">
                                        <h5 className="font-bricolage text-[11px] sm:text-xs font-black tracking-tight text-black dark:text-white leading-tight group-hover:text-primary transition-colors truncate w-full">
                                          {doc.name}
                                        </h5>
                                        <p className="text-[8.5px] text-black/40 dark:text-white/40 font-bold font-outfit truncate w-full">
                                          {doc.email}
                                        </p>
                                      </div>

                                      <div className="text-[8px] font-black uppercase tracking-wider text-black/40 dark:text-white/40 group-hover:text-primary transition-colors flex items-center justify-center gap-0.5 shrink-0 mt-1">
                                        <span>Connect</span>
                                        <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-all text-black/40 dark:text-white/40 group-hover:text-primary" />
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleInvite} className="grid gap-5 z-10">
                              <div className="grid gap-2 relative">
                                <Label htmlFor="doctor-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                  Doctor's Full Name
                                </Label>
                                <Input
                                  id="doctor-name"
                                  placeholder="e.g. Dr. Sarah Jenkins"
                                  required
                                  value={doctorName}
                                  onChange={(e) => {
                                    setDoctorName(e.target.value);
                                    setShowDoctorSuggestions(true);
                                  }}
                                  onFocus={() => setShowDoctorSuggestions(true)}
                                  className="h-14 sm:h-16 rounded-2xl border-black/5 bg-black/5 pl-6 text-base sm:text-lg font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
                                />
                              </div>

                              <div className="grid gap-2 relative">
                                <Label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                  Doctor's Secure Email
                                </Label>
                                <Input
                                  id="contact-email"
                                  type="email"
                                  required
                                  placeholder="dr.jenkins@hospital.com"
                                  value={contactInfo}
                                  onChange={(e) => {
                                    setContactInfo(e.target.value);
                                    setShowDoctorSuggestions(true);
                                  }}
                                  onFocus={() => setShowDoctorSuggestions(true)}
                                  className="h-14 sm:h-16 rounded-2xl border-black/5 bg-black/5 pl-6 text-base sm:text-lg font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
                                />

                                {showDoctorSuggestions && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default" 
                                      onClick={() => setShowDoctorSuggestions(false)} 
                                    />
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#121212] border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto p-2 backdrop-blur-xl bg-white/95 dark:bg-[#0c0c0c]/95">
                                      <div className="text-[9px] font-black uppercase tracking-wider text-black/40 dark:text-white/40 px-3 py-2 flex justify-between items-center">
                                        <span>Quick Autocomplete</span>
                                        <button 
                                          type="button" 
                                          className="text-[9px] text-primary font-bold hover:underline cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDoctorSuggestions(false);
                                          }}
                                        >
                                          Close
                                        </button>
                                      </div>
                                      
                                      {POPULAR_DOCTORS.map((doc, idx) => (
                                        <div
                                          key={`suggest-pop-${idx}`}
                                          onMouseDown={() => {
                                            setDoctorName(doc.name);
                                            setContactInfo(doc.email);
                                            setShowDoctorSuggestions(false);
                                          }}
                                          className="flex items-center gap-3 p-2 hover:bg-primary/10 rounded-2xl cursor-pointer text-left transition-all"
                                        >
                                          <img src={doc.avatar} className="w-8 h-8 rounded-xl object-cover" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-black dark:text-white truncate">{doc.name}</div>
                                            <div className="text-[10px] text-black/40 dark:text-white/40 font-medium truncate">{doc.email}</div>
                                          </div>
                                        </div>
                                      ))}

                                      {combinedDoctors.map((doc, idx) => (
                                        <div
                                          key={`suggest-my-${idx}`}
                                          onMouseDown={() => {
                                            setDoctorName(doc.name);
                                            setContactInfo(doc.email);
                                            setShowDoctorSuggestions(false);
                                          }}
                                          className="flex items-center gap-3 p-2 hover:bg-primary/10 rounded-2xl cursor-pointer text-left transition-all"
                                        >
                                          <img src={doc.avatar} className="w-8 h-8 rounded-xl object-cover" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-black dark:text-white truncate">{doc.name}</div>
                                            <div className="text-[10px] text-black/40 dark:text-white/40 font-medium truncate">{doc.email}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                  Encrypted Message (Optional)
                                </Label>
                                <textarea
                                  id="message"
                                  placeholder="Add context for your doctor..."
                                  value={initialMessage}
                                  onChange={(e) => setInitialMessage(e.target.value)}
                                  className="min-h-[80px] sm:min-h-24 resize-none rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-4 text-sm sm:text-base font-medium transition-all focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
                                />
                              </div>

                              <Button type="submit" disabled={isSubmitting} className="h-14 sm:h-16 rounded-[24px] sm:rounded-3xl bg-primary text-white font-black text-base sm:text-lg hover:scale-[1.02] active:scale-95 shadow-xl mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Encrypting...
                                  </div>
                                ) : (
                                  "Send Secure Link"
                                )}
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col min-h-[600px] lg:h-[750px] w-full bg-white dark:bg-[#0f0f0f] rounded-4xl border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden relative"
        >
          <div className="p-6 bg-white dark:bg-[#0f0f0f] border-b border-black/5 dark:border-white/5 flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center shadow-inner relative">
                <MessageCircle className="w-7 h-7 text-[#25D366]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bricolage text-xl font-bold dark:text-white">{doctorName}</h3>
                <span className="text-xs font-bold text-green-500 uppercase">Live via WhatsApp</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-xl opacity-40 cursor-pointer"><Phone className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-xl opacity-40 cursor-pointer"><Bell className="w-5 h-5" /></Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 bg-black/[0.01]"
          >
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[85%] ${m.sender === "user" ? "ml-auto items-end" : "items-start"}`}
              >
                <div className={cn(
                  "p-5 rounded-3xl text-sm leading-relaxed shadow-sm overflow-hidden",
                  m.sender === "user"
                    ? "bg-black dark:bg-blue-600 text-white rounded-tr-none shadow-xl shadow-black/10"
                    : "bg-white dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10 rounded-tl-none shadow-md shadow-black/2"
                )}>
                  {m.type === "image" && m.mediaUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden shadow-lg border border-black/5">
                      <img src={m.mediaUrl} alt="Clinical Attachment" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                  )}
                  {(m.type === "audio" || m.type === "voice") && m.mediaUrl && (
                    <div className="mb-3 p-4 bg-black/5 rounded-2xl flex items-center gap-3">
                      <Mic className="w-5 h-5 text-primary" />
                      <audio src={m.mediaUrl} controls className="h-10 w-48" />
                    </div>
                  )}
                  <p className="font-bold">{m.text}</p>
                </div>
                <span className="text-[10px] font-black text-black/30 dark:text-white/30 mt-2 px-2 uppercase tracking-widest">{m.timestamp}</span>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-4 bg-black/5 rounded-2xl w-fit"
              >
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">Doctor is typing</span>
              </motion.div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-4 sm:p-6 bg-white dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5 flex gap-2 sm:gap-4 items-center">
            <div className="flex gap-1 sm:gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-black/5 text-black/60 hover:bg-black/10 transition-colors cursor-pointer">
                <Plus className="w-5 h-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="hidden sm:flex h-12 w-12 rounded-xl bg-black/5 text-black/60 hover:bg-black/10 transition-colors cursor-pointer">
                <Wrench className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 relative">
              <Input
                placeholder="Message your Doctor..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-black/5 bg-black/5 px-4 sm:pl-6 text-sm sm:text-base font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!newMessage.trim()}
              className={cn(
                "h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center",
                newMessage.trim() ? "bg-primary text-white scale-100" : "bg-black/5 text-black/20 scale-95"
              )}
            >
              <ArrowUp className="w-5 h-5 sm:w-6 sm:w-6" />
            </Button>
          </form>
        </motion.div>
      )}

      <AnimatePresence>
        {isInvited && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl px-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              className="flex flex-col items-center justify-center gap-6 rounded-4xl bg-white dark:bg-[#0a0a0a] p-10 lg:p-14 shadow-2xl border border-black/5 dark:border-white/5 w-full max-w-lg text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[#25D366] animate-progress" />
              <CheckCircle2 className="h-12 w-12 text-[#25D366]" />
              <div className="space-y-2">
                <h3 className="font-bricolage text-2xl font-extrabold text-black dark:text-white">Invitation Sent!</h3>
                <p className="text-sm font-medium text-black/40 dark:text-white/40">Connecting to {doctorName}...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        .animate-progress {
          animation: progress 5s linear;
        }
      `}</style>
    </div>
  );
}
