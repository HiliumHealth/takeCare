"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Phone, UserPlus, ArrowRight, CheckCircle2, Bell, BellRing, Settings, MoreVertical, Paperclip, Smile, Mic, Mail, X, ArrowUp, Plus, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-[#25D366]", bg: "bg-[#25D366]/10" },
  { id: "telegram", label: "Telegram", icon: Send, color: "text-[#0088cc]", bg: "bg-[#0088cc]/10" },
  { id: "gmail", label: "Gmail", icon: Mail, color: "text-red-500", bg: "bg-red-500/10" },
];

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor";
  timestamp: string;
  type?: string;     // text, image, voice, audio, video
  mediaUrl?: string; // URL for the media
}

export function MessengerSection({ onNotificationSync, onInviteSuccess }: { onNotificationSync?: (count: number) => void; onInviteSuccess?: () => void; }) {
  const [platform, setPlatform] = useState("whatsapp");
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

    // Normalize to digits only for API if it's a phone number
    let formattedNumber = platform === "gmail" ? contactInfo : contactInfo.replace(/\D/g, "");
    setIsSubmitting(true);

    try {
      const endpoint = `/api/messenger/${platform}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: formattedNumber, // Kept for backwards compatibility with Whatsapp route
          contactInfo: formattedNumber, // Used by Gmail/Telegram route
          contactName: doctorName,
          doctorName: doctorName,
          initialMessage: initialMessage,
          platform: platform,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsInvited(true);
        setIsPopupOpen(false); // Close the popup upon success
        // After showing the success modal, we stay on this page 
        // briefly, then reset the form and trigger the success callback
        setTimeout(() => {
          setIsInvited(false);
          setDoctorName("");
          setContactInfo("");
          setInitialMessage("");
          
          if (onInviteSuccess) {
            onInviteSuccess();
          } else {
            setIsChatActive(true); // Fallback if no callback
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
          <div className="bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-full lg:w-fit h-auto flex gap-1 transition-colors">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setPlatform(p.id);
                  setIsPopupOpen(true);
                }}
                className={cn(
                  "rounded-xl px-6 py-2.5 transition-all duration-300 cursor-pointer flex-1 lg:flex-none flex items-center justify-center gap-2 font-outfit font-bold text-sm",
                  "hover:bg-white dark:hover:bg-white/10 hover:shadow-sm text-black/80 dark:text-white focus:outline-none active:scale-95"
                )}
              >
                <p.icon className={cn("h-4 w-4 transition-colors", p.color)} />
                {p.label}
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
                  className="w-full sm:max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-t-[40px] sm:rounded-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative cursor-default transition-colors duration-500"
                >
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="absolute top-6 right-6 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors z-10 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-black/60 dark:text-white/60" />
                  </button>

                  {(() => {
                    const p = PLATFORMS.find(pl => pl.id === platform) || PLATFORMS[0];
                    return (
                      <div className="flex flex-col gap-8 relative overflow-hidden mt-2">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                        <div className="flex flex-col gap-8">
                          <div className="flex items-center gap-6">
                            <div className={cn("relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl shadow-xl", p.bg)}>
                              <p.icon className={cn("h-10 w-10", p.color)} />
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bricolage text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight dark:text-white">
                                Invite via <span className={p.color}>{p.label}</span>
                              </h3>
                              <p className="text-sm font-medium text-black/40 dark:text-white/40">
                                {p.id === "gmail"
                                  ? "Send a secure invitation directly to their Gmail."
                                  : `Direct ${p.label} integration for diagnostics.`}
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleInvite} className="grid gap-5">
                            <div className="grid gap-2">
                              <Label htmlFor={`doctor-name-${p.id}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                Doctor's Full Name
                              </Label>
                              <Input
                                id={`doctor-name-${p.id}`}
                                placeholder="e.g. Dr. Sarah Jenkins"
                                required
                                value={doctorName}
                                onChange={(e) => setDoctorName(e.target.value)}
                                className="h-14 sm:h-16 rounded-2xl border-black/5 bg-black/5 pl-6 text-base sm:text-lg font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`contact-${p.id}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                {p.id === "gmail" ? "Doctor's Gmail" : `${p.label} Number`}
                              </Label>
                              <Input
                                id={`contact-${p.id}`}
                                type={p.id === "gmail" ? "email" : "tel"}
                                required
                                placeholder={p.id === "gmail" ? "gita@gmail.com" : "Ex: 237670000000"}
                                value={contactInfo}
                                onChange={(e) => setContactInfo(e.target.value)}
                                className="h-14 sm:h-16 rounded-2xl border-black/5 bg-black/5 pl-6 text-base sm:text-lg font-bold transition-all focus:bg-white focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`message-${p.id}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                                Optional Message
                              </Label>
                              <textarea
                                id={`message-${p.id}`}
                                placeholder="Add a personalized message..."
                                value={initialMessage}
                                onChange={(e) => setInitialMessage(e.target.value)}
                                className="min-h-[80px] sm:min-h-24 resize-none rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-4 text-sm sm:text-base font-medium transition-all focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-inner hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white"
                              />
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="h-14 sm:h-16 rounded-[24px] sm:rounded-3xl bg-primary text-white font-black text-base sm:text-lg hover:scale-[1.02] active:scale-95 shadow-xl mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                              {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  Sending...
                                </div>
                              ) : (
                                `Send ${p.label} Invitation`
                              )}
                            </Button>
                          </form>
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

      <style jsx global>{`
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
