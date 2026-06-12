"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Mic,
  MessageSquareText,
  BarChart3,
  Send,
  Paperclip,
  Bot,
  User,
  Activity,
  Zap,
  Search,
  FileText,
  Watch,
  X,
  Plus,
  ArrowRight,
  PhoneOff,
  Video,
  MicOff,
  Circle,
  FileUp,
  Camera,
  Loader2,
  Trash2,
  ChevronDown,
  ExternalLink,
  Heart,
  Brain,
  Pill,
  Clock,
  ChevronRight,
  FileDown,
  ArrowLeft,
  ShieldCheck,
  History,
  BookOpen,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SYNTHETIC_DOCTOR_DATA } from "@/lib/doctor-data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Vapi from "@vapi-ai/web";
import { getVapiConfiguration } from "../../app/actions/vapi";
import { getMyMedicalHistory } from "../../app/actions/medical";
import { useSession } from "next-auth/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatbotView } from "./smart-care/chatbot-view";


const SMART_CARE_TABS = [
  { id: "talk", label: "Talk", icon: Mic, description: "Voice interaction with Hilium medical agent" },
  { id: "text", label: "Chat", icon: MessageSquareText, description: "Secure chat with Hilium AI" },
  { id: "analyze", label: "Analyze", icon: BarChart3, description: "Deep analysis of health records" },
];

export function SmartCareSection({ 
  userName = "Patient",
  initialRecords = []
}: { 
  userName?: string,
  initialRecords?: any[]
}) {
  const [activeTab, setActiveTab] = useState("talk");
  const [medicalContext, setMedicalContext] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<any[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(true);
  const processedMessageRef = useRef<string | null>(null);

  const { data: session, status } = useSession();

  // Memoize initial messages in SDK v6 UIMessage format (uses parts[], not content)
  const initialChatMessages = useMemo(() => [
    {
      id: "welcome",
      role: "assistant" as const,
      parts: [
        {
          type: "text" as const,
          text: `Hello ${userName.split(" ")[0]}! I'm Dr. Gita. I have access to your medical records and consultation history. How can I assist you with your health today?`,
        },
      ],
    },
  ], [userName]);

  // useChat v6: simpler configuration
  const { messages, sendMessage: sdkSendMessage, status: chatStatus, setMessages } = useChat({
    id: "smart-care-chat",
    // In AI SDK v6, default is /api/chat which is what we want here.
    messages: initialChatMessages,
    onError: (error) => {
      console.error("useChat SDK Error Details:", error);
      toast.error(`Chat Communication Error: ${error.message || "Something went wrong"}`);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, I ran into a technical issue processing your request. Could you please try asking me again?",
        } as any
      ]);
    },
  });

  // --- Auto-Continuation Hack ---
  // If the stream finishes and the last assistant message has tool results, send a hidden continuation message.
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      
      const hasToolResult = 
        lastMsg.toolInvocations?.some((t: any) => t.state === 'result') || 
        lastMsg.parts?.some((p: any) => p.type === 'tool-invocation' && p.toolInvocation?.state === 'result');

      if (lastMsg.role === 'assistant' && lastMsg.id !== processedMessageRef.current && hasToolResult) {
        setTimeout(() => {
          processedMessageRef.current = lastMsg.id;
          console.log("SmartCareSection: Auto-continuing after tool execution.");
          sdkSendMessage({ text: "[HIDDEN] Please continue and provide your summary based on the tool results." });
        }, 500);
      }
    }
  }, [messages, sdkSendMessage]);

  const visibleMessages = messages.filter((msg: any) => {
    if (msg.parts?.length) {
      return !msg.parts.some((p: any) => p.type === 'text' && p.text?.startsWith('[HIDDEN]'));
    }
    return !msg.content?.startsWith('[HIDDEN]');
  });

  // Sync with prop updates from parent
  useEffect(() => {
    if (initialRecords && initialRecords.length > 0) {
      setAllRecords(initialRecords);
      // If we don't have a context yet, pick the best one
      if (!medicalContext) {
        const recentRecord = initialRecords.find((r: any) => r.analysis);
        if (recentRecord && recentRecord.analysis) {
          setMedicalContext(recentRecord.analysis.rawJson || null);
          setAnalysisResult(recentRecord.analysis.summary);
          setSelectedRecordId(recentRecord.id);
        }
      }
    }
  }, [initialRecords]);

  const sendMessage = async (data: any) => {
    const text = typeof data === 'string' ? data : data?.text;
    if (!text) return;

    try {
      console.log("SmartCareSection: Sending message:", text);
      // AI SDK v6: sendMessage expects an object with a 'text' property
      await sdkSendMessage({ text });
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast.error(`Failed to send: ${err.message}`);
    }
  };

  // Automatically load the extracted context from the database
  useEffect(() => {
    async function loadHistory() {
      if (status !== "authenticated") return;
      
      try {
        const data = await getMyMedicalHistory();

        if (data && data.medicalRecords && data.medicalRecords.length > 0) {
          setAllRecords(data.medicalRecords);
          // Find the most recent record with a valid analysis
          const recentRecord = data.medicalRecords.find((r: any) => r.analysis);
          if (recentRecord && recentRecord.analysis) {
            setMedicalContext(recentRecord.analysis.rawJson || null);
            setAnalysisResult(recentRecord.analysis.summary);
            setSelectedRecordId(recentRecord.id);
          }

        } else {
          // No records found for this user, leave context null
          setMedicalContext(null);
          setAllRecords([]);
          setAnalysisResult(null);
        }
      } catch (error) {
        console.error("Failed to load medical history:", error);
      }
    }
    loadHistory();
  }, [status]);


  return (
    <div className="px-4 lg:px-6 mt-1 flex flex-col gap-3 flex-1 min-h-0 relative antialiased">
      <AnimatePresence mode="wait">
        {showSelection ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col items-center justify-center min-h-[65vh] w-full"
          >
            <div className="text-center mb-6 max-w-xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
              >
                <div className="flex justify-center mb-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">
                    Hilium Health Assistant
                  </Badge>
                </div>
                
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bricolage font-black tracking-tight text-black dark:text-white mb-3">
                  How can I help you <span className="text-primary">today?</span>
                </h2>
                
                <p className="text-black/70 dark:text-white/70 text-xs md:text-sm font-semibold max-w-lg mx-auto leading-relaxed tracking-tight">
                  Choose a personalized health tool below to review your medical history, ask questions about your records, or chat directly with our friendly clinical assistant.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto px-4">
              {SMART_CARE_TABS.map((tab, idx) => (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowSelection(false);
                  }}
                  className="relative flex flex-col items-start p-5.5 rounded-2xl md:rounded-[1.75rem] cursor-pointer transition-all duration-500 overflow-hidden group bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(var(--primary-rgb),0.15)] hover:border-primary/30"
                >
                  <div className="h-11 w-11 rounded-xl bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <tab.icon className="h-5 w-5 stroke-[1.5]" />
                  </div>

                  <div className="relative z-10 text-left">
                    <h3 className="text-base md:text-lg font-bricolage font-black tracking-tight text-black dark:text-white mb-1.5">
                      {tab.label}
                    </h3>
                    <p className="text-xs text-black/70 dark:text-white/70 font-semibold leading-relaxed tracking-tight group-hover:text-black dark:group-hover:text-white transition-colors">
                      {tab.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-primary font-bold text-xs opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0">
                    Get Started <ArrowRight className="h-3.5 w-3.5" />
                  </div>

                  {/* Decorative background element */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            {/* Context Header / Back Button */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <Button
                variant="ghost"
                onClick={() => setShowSelection(true)}
                className="group flex items-center gap-3 px-3.5 py-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              >
                <div className="h-7.5 w-7.5 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-bricolage font-black text-sm tracking-tight">Back to Selection</span>
              </Button>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-black uppercase tracking-widest text-black/30 dark:text-white/30">Active Mode</p>
                  <p className="text-sm font-bricolage font-black text-black dark:text-white">
                    {SMART_CARE_TABS.find(t => t.id === activeTab)?.label}
                  </p>
                </div>
                <div className="h-8.5 w-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {React.createElement(SMART_CARE_TABS.find(t => t.id === activeTab)?.icon || Bot, { className: "h-4.5 w-4.5" })}
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                <TabsContent value="talk" key="talk" className="flex-1 m-0 focus-visible:ring-0">
                  <VoiceAgentView
                    medicalContext={medicalContext}
                    userName={userName}
                    allConsultations={allRecords.filter(r => r.analysis || r.type === "CLINICAL_NOTE")}
                    onSelectionChange={(record: any) => {
                      setSelectedRecordId(record.id);
                      if (record.analysis) {
                        setMedicalContext(record.analysis.rawJson);
                        setAnalysisResult(record.analysis.summary);
                      } else if (record.type === "CLINICAL_NOTE") {
                        setAnalysisResult(record.extractedText);
                        setMedicalContext(null);
                      }
                    }}
                    selectedRecordId={selectedRecordId}
                  />
                </TabsContent>

                <TabsContent value="text" key="text" className="flex-1 m-0 focus-visible:ring-0 h-[calc(100vh-160px)] overflow-hidden -mx-4 lg:-mx-6">
                  <ChatbotView 
                    userName={userName} 
                    messages={visibleMessages}
                    sendMessage={sendMessage}
                    status={chatStatus}
                    setMessages={setMessages}
                  />
                </TabsContent>

                <TabsContent value="analyze" key="analyze" className="flex-1 m-0 focus-visible:ring-0">
                  <AnalysisView
                    medicalContext={medicalContext}
                    userName={userName}
                    onContextUpdate={setMedicalContext}
                    analysisResult={analysisResult}
                    setAnalysisResult={setAnalysisResult}
                    patientId={patientId}
                    allRecords={allRecords}
                  />
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function VoiceAgentView({
  medicalContext,
  userName,
  allConsultations,
  onSelectionChange,
  selectedRecordId
}: {
  medicalContext: any,
  userName: string,
  allConsultations: any[],
  onSelectionChange: (record: any) => void,
  selectedRecordId: string | null
}) {
  const { data: session } = useSession();
  const [callStatus, setCallStatus] = useState<"inactive" | "connecting" | "active">("inactive");
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);

  useEffect(() => {
    // Initialize Vapi client using the environment variable
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Vapi Public Key is missing in environment variables!");
      return;
    }
    const v = new Vapi(publicKey);
    setVapiInstance(v);

    v.on("call-start", () => setCallStatus("active"));
    v.on("call-end", () => {
      setCallStatus("inactive");
      setIsDoctorSpeaking(false);
    });
    v.on("speech-start", () => setIsDoctorSpeaking(true));
    v.on("speech-end", () => setIsDoctorSpeaking(false));
    v.on("error", (e) => {
      console.error("Vapi Error:", e);
      setCallStatus("inactive");
      setIsDoctorSpeaking(false);
    });

    return () => {
      v.stop();
    };
  }, []);

  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);

  useEffect(() => {
    // Pre-select most recent/active medications if available
    if (medicalContext?.patient_summary?.medications) {
      setSelectedMeds(medicalContext.patient_summary.medications.map((m: any) => m.name));
    }
  }, [medicalContext]);

  const toggleMedication = (name: string) => {
    setSelectedMeds(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const toggleVoiceConsultation = async () => {
    if (callStatus === "active") {
      vapiInstance?.stop();
      return;
    }

    setCallStatus("connecting");
    setIsDoctorSpeaking(false);

    try {
      const result = await getVapiConfiguration();
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      if (!result.success || !result.config) {
        console.warn("Failed to retrieve Vapi config", result.error);
        setCallStatus("inactive");
        return;
      }

      const selectedMedDetails = medicalContext?.patient_summary?.medications?.filter((m: any) => selectedMeds.includes(m.name)) || [];

      // Create dynamic context-aware prompt
      const contextPrompt = medicalContext ? `
        PATIENT MEDICAL CONTEXT (JSON):
        ${JSON.stringify(medicalContext, null, 2)}
        
        SELECTED MEDICATIONS TO DISCUSS:
        ${JSON.stringify(selectedMedDetails, null, 2)}

        INSTRUCTIONS:
        You are Dr. Gita, a compassionate AI health assistant for Hilium. Use the latest records to provide advice.
        - Discuss specific medications: ${selectedMeds.join(", ")}.
        - Address symptoms and provide empathetic, clear guidance.
        - Address the user by their first name: ${userName.split(' ')[0]}.
        - Be professional, empathetic, and clear.
      ` : result.config.systemPrompt;

      const firstMessage = selectedMeds.length > 0
        ? `Hello ${userName.split(' ')[0]}, I've reviewed your results. I see you want to discuss your treatment using ${selectedMeds.join(" and ")}. How have you been feeling since you started them?`
        : medicalContext
          ? `Hello ${userName.split(' ')[0]}, I've reviewed your latest results. How are you feeling today?`
          : `Hello ${userName.split(' ')[0]}, this is your TakeCare AI Assistant. How can I help you today?`;

      await vapiInstance?.start(assistantId, {
        name: "TakeCare AI Doctor",
        firstMessage,
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [{ role: "system", content: contextPrompt }],
          temperature: 0.6,
        },
        voice: {
          provider: "vapi",
          voiceId: "Leo",
        },
        backgroundDenoisingEnabled: true,
        metadata: {
          userId: session?.user?.id,
          userName: userName,
        },
      });

    } catch (error) {
      console.error("Failed to start voice:", error);
      setCallStatus("inactive");
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    vapiInstance?.setMuted(nextMuted);
  };

  const endCall = () => {
    vapiInstance?.stop();
    setCallStatus("inactive");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0a] shadow-xl min-h-[400px]"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-vital-orange/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-5 md:gap-6 relative z-10 pt-2 md:pt-4">
        
        {/* BIG PULSING AVATAR */}
        <div className="relative flex flex-col items-center justify-center">
          <AnimatePresence>
            {callStatus !== "inactive" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.25, opacity: 0.15 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-0 bg-primary rounded-full z-0 pointer-events-none"
              />
            )}
            {isDoctorSpeaking && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.45, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 bg-primary/30 rounded-full z-0 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden shadow-xl shadow-primary/10 border-2 md:border-4 border-white dark:border-white/10 z-10">
            <img
              src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png"
              alt="Dr. Gita"
              className={cn(
                "h-full w-full object-cover transition-all duration-700",
                callStatus === "active" ? "scale-105" : "scale-100 grayscale-[10%]"
              )}
            />
            {/* Soft inner shadow overlay */}
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] rounded-full pointer-events-none" />
          </div>
          
          <div className="mt-4 text-center z-10">
            <h3 className="font-bricolage text-lg md:text-xl font-extrabold text-black dark:text-white tracking-tighter flex items-center justify-center gap-1.5">
              Dr. Gita
              {callStatus === "active" && (
                <span className="relative flex h-2.5 w-2.5 -mt-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
                </span>
              )}
            </h3>
            <p className="text-black/50 dark:text-white/50 font-bold text-[9px] md:text-[10px] mt-1 uppercase tracking-[0.2em]">
              AI Clinical Assistant
            </p>
          </div>
        </div>

        {/* CALL CONTROLS */}
        <div className="flex flex-col items-center gap-4 w-full z-10">
          <Badge
            className={cn(
              "px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              callStatus === "active" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border-transparent",
              callStatus !== "inactive" && "animate-pulse"
            )}
          >
            {callStatus === "active" ? (isDoctorSpeaking ? "Doctor Speaking..." : "Listening...") : callStatus === "connecting" ? "Secure Handshake..." : "Ready to Consult"}
          </Badge>

          <div className="flex items-center justify-center gap-3 bg-white/60 dark:bg-black/60 backdrop-blur-3xl p-2.5 rounded-full border border-black/5 dark:border-white/5 shadow-lg w-fit">
            <button
              onClick={toggleMute}
              disabled={callStatus !== "active"}
              className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all",
                isMuted ? "bg-red-50 text-red-500" : "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105",
                callStatus !== "active" && "opacity-30 cursor-not-allowed"
              )}
            >
              {isMuted ? <MicOff className="h-4.5 w-4.5 md:h-5 w-5" /> : <Mic className="h-4.5 w-4.5 md:h-5 w-5" />}
            </button>

            {callStatus === "active" ? (
              <button
                onClick={endCall}
                className="h-10 px-5 md:h-12 md:px-6 rounded-full flex items-center gap-1.5 transition-all bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-md shadow-red-500/20 font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:scale-105"
              >
                <PhoneOff className="h-4.5 w-4.5 md:h-5 w-5" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                disabled={callStatus === "connecting"}
                onClick={toggleVoiceConsultation}
                className="h-10 px-6 md:h-12 md:px-8 rounded-full flex items-center gap-1.5 transition-all bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 text-white shadow-md shadow-primary/20 font-black text-[9px] md:text-[10px] uppercase tracking-widest"
              >
                {callStatus === "connecting" ? (
                  <Loader2 className="h-4.5 w-4.5 md:h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-4.5 w-4.5 md:h-5 w-5" />
                )}
                {callStatus === "connecting" ? "Connecting" : "Consult Now"}
              </button>
            )}

            <button
              disabled={callStatus !== "active"}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Video className="h-4.5 w-4.5 md:h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MEDICAL CONTEXT SELECTORS (Hidden when call is active to keep UI completely clean) */}
        <AnimatePresence>
          {callStatus === "inactive" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full flex justify-center overflow-hidden pb-4 md:pb-0"
            >
              <div className="w-full max-w-lg flex flex-col gap-5 border-t border-black/5 dark:border-white/5 pt-8 mt-2">
                <p className="text-[9px] md:text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] text-center w-full">Context & Records</p>
                
                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-2 -mx-2 items-center snap-x">
                  {allConsultations.length > 0 ? (
                    allConsultations.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => onSelectionChange(record)}
                        className={cn(
                          "p-3 md:p-4 rounded-[1.5rem] border transition-all text-left flex flex-col gap-2 relative overflow-hidden min-w-[220px] shrink-0 snap-center",
                          selectedRecordId === record.id
                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg"
                            : "bg-white dark:bg-[#0a0a0a] text-black dark:text-white border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-sm hover:scale-[1.02]"
                        )}
                      >
                        {selectedRecordId === record.id && (
                          <div className="absolute top-4 right-4">
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            selectedRecordId === record.id ? "bg-white/10" : 
                            record.type === "CLINICAL_NOTE" ? "bg-[#25D366]/10" : "bg-black/5"
                          )}>
                            {record.type === "CLINICAL_NOTE" ? (
                              <ShieldCheck className={cn("h-4 w-4", selectedRecordId === record.id ? "text-white dark:text-black" : "text-[#25D366]")} />
                            ) : (
                              <FileText className={cn("h-4 w-4", selectedRecordId === record.id ? "text-white dark:text-black" : "text-black/40 dark:text-white/40")} />
                            )}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest truncate w-[85%]">
                            {record.type === "CLINICAL_NOTE" ? "Doctor Assessment" : record.fileName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] md:text-xs font-bold line-clamp-1 opacity-80 mt-1">{record.description || "Medical Analysis"}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center w-full text-xs text-black/40 dark:text-white/40 font-medium">No prior records linked to this consultation.</p>
                  )}
                </div>

                {medicalContext?.patient_summary?.medications?.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar px-2 -mx-2 snap-x items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.2em] shrink-0 mr-1">Topics:</span>
                    {medicalContext.patient_summary.medications.map((med: any) => (
                      <button
                        key={med.name}
                        onClick={() => toggleMedication(med.name)}
                        className={cn(
                          "px-4 py-2 rounded-full border transition-all flex items-center gap-1.5 shrink-0 snap-center",
                          selectedMeds.includes(med.name)
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "bg-white dark:bg-white/5 text-black/60 dark:text-white/60 border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.05]"
                        )}
                      >
                        <Pill className={cn("h-3 w-3", selectedMeds.includes(med.name) ? "text-white" : "text-primary")} />
                        <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">{med.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}





function AnalysisView({
  medicalContext,
  userName,
  onContextUpdate,
  analysisResult,
  setAnalysisResult,
  patientId,
  allRecords
}: {
  medicalContext: any,
  userName: string,
  onContextUpdate: (ctx: any) => void,
  analysisResult: string | null,
  setAnalysisResult: (res: string | null) => void,
  patientId: string | null,
  allRecords: any[]
}) {
  const [analysisTab, setAnalysisTab] = useState<"upload" | "results" | "professional">("upload");
  const doctorNotes = allRecords.filter(r => r.type === "CLINICAL_NOTE" || r.type === "CLINICAL_ASSESSMENT");

  const [analyzing, setAnalyzing] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchQuery, setResearchQuery] = useState("");
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [researchSources, setResearchSources] = useState<any[]>([]);
  const [showSim, setShowSim] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [fullAnalysisResult, setFullAnalysisResult] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportRef = useRef<HTMLElement>(null);
  const researchReportRef = useRef<HTMLDivElement>(null);

  const handleDownloadResearchPDF = async () => {
    if (!researchReportRef.current) return;
    
    const toastId = toast.loading("Generating your clinical research PDF...");
    try {
      const element = researchReportRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 290));
      pdf.save(`Research_${researchQuery.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
      toast.success("Research report downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate research PDF", { id: toastId });
    }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current || isDownloading) return;
    
    const toastId = toast.loading("Preparing your professional health report...");
    
    try {
      setIsDownloading(true);
      console.log("Initializing stable PDF capture sequence...");
      
      const element = reportRef.current;
      if (!element) {
        throw new Error("Target report element not found in DOM");
      }

      // Ensure the element is visible for capture
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      
      // Small timeout to ensure DOM paints are set
      await new Promise(resolve => setTimeout(resolve, 300));

      const captureWidth = 820; 
      
      const canvas = await html2canvas(element, {
        scale: 1, 
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
        width: captureWidth,
        windowWidth: captureWidth,
        onclone: (clonedDoc) => {
          // IMPORTANT: html2canvas does not support modern color functions like oklch/oklab
          // We must force legacy-compatible colors in the cloned document
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #takecare-pdf-report, #takecare-pdf-report * {
              color: #000000 !important;
              border-color: #e5e7eb !important;
              background-color: transparent !important;
              text-shadow: none !important;
              box-shadow: none !important;
            }
            #takecare-pdf-report {
              background-color: #ffffff !important;
              width: ${captureWidth}px !important;
              padding: 60px !important;
              margin: 0 !important;
            }
            /* Reset prose to basic elements for cleaner capture */
            #takecare-pdf-report h1, #takecare-pdf-report h2, #takecare-pdf-report h3 {
              color: #000000 !important;
              font-family: sans-serif !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          const report = clonedDoc.getElementById('takecare-pdf-report');
          if (report) {
            report.style.display = 'block';
            report.style.visibility = 'visible';
            report.style.opacity = '1';
          }
        }
      });
      
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas generation returned an empty result");
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      while (heightLeft > 0) {
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;
        
        if (heightLeft > 0) {
          pdf.addPage();
          position = -pdfHeight * (pdf.internal.pages.length - 1);
        }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`TakeCare_Health_Synthesis_${dateStr}.pdf`);
      
      toast.success("Health report generated successfully!", { id: toastId });
    } catch (error: any) {
      console.error("PDF engine crash detail:", error);
      toast.error("Format compatibility error.", { 
        id: toastId,
        description: `Technical details: ${error.message}. We've force-simplified the colors for the PDF.`
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // AI Analysis State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Bluetooth State
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const intentionalDisconnectRef = useRef(false);

  // Automatically handle analysis completion
  useEffect(() => {
    if (analyzing) {
      if (progress < 100) {
        const interval = setInterval(() => {
          setProgress(prev => (prev < 100 ? prev + 1 : 100));
        }, 30);
        return () => clearInterval(interval);
      } else {
        const synthesizeHealth = async () => {
          try {
            // Perform a global health research synthesis based on the patient's context
            const query = medicalContext 
              ? `General health status summary and latest research for a patient with: ${JSON.stringify(medicalContext)}. What are the latest developments and lifestyle recommendations?`
              : "Latest preventative health research and wellness optimizations for 2026.";

            const response = await fetch("/api/health-research", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query, medicalContext }),
            });

            const data = await response.json();
            setFullAnalysisResult(data.report || "Synthesis failed. Please try again.");
            setShowAnalysisModal(true);
          } catch (error) {
            console.error("Synthesis error:", error);
            toast.error("Failed to synthesize health data.");
          } finally {
            setAnalyzing(false);
            setProgress(0);
          }
        };
        synthesizeHealth();
      }
    }
  }, [analyzing, progress, medicalContext]);

  const onDisconnected = async (event: any) => {
    const device = event.target;
    setHeartRate(null);
    setBatteryLevel(null);
    if (intentionalDisconnectRef.current) {
      setBleDevice(null);
      return;
    }

    setConnectionError("Connection lost. Trying to reconnect...");
    setIsConnecting(true);
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !intentionalDisconnectRef.current) {
      try {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        console.log(`Reconnection attempt ${attempts}...`);

        await setupGattServer(device);
        setConnectionError(null);
        setIsConnecting(false);
        return;
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
      }
    }

    setConnectionError("Failed to reconnect after multiple attempts. Please pair again.");
    setIsConnecting(false);
    setBleDevice(null);
  };

  const setupGattServer = async (device: any) => {
    const server = await device.gatt.connect();

    try {
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        try {
          const value = event.target.value;
          const flags = value.getUint8(0);
          const rate16Bits = flags & 0x1;
          let hr: number;
          if (rate16Bits) {
            hr = value.getUint16(1, true);
          } else {
            hr = value.getUint8(1);
          }
          setHeartRate(hr);
        } catch (e) {
          console.error("Error parsing heart rate:", e);
        }
      });
    } catch (serviceErr) {
      console.warn("Heart Rate service not found or could not be loaded.", serviceErr);
    }

    try {
      const batService = await server.getPrimaryService('battery_service');
      const batChar = await batService.getCharacteristic('battery_level');

      const val = await batChar.readValue();
      setBatteryLevel(val.getUint8(0));

      await batChar.startNotifications();
      batChar.addEventListener('characteristicvaluechanged', (event: any) => {
        setBatteryLevel(event.target.value.getUint8(0));
      });
    } catch (err) {
      console.warn("Battery service not found.", err);
    }
  };

  const handleDisconnect = () => {
    if (bleDevice && bleDevice.gatt) {
      intentionalDisconnectRef.current = true;
      bleDevice.gatt.disconnect();
      setBleDevice(null);
      setHeartRate(null);
      setBatteryLevel(null);
    }
  };

  const connectDevice = async () => {
    setConnectionError(null);
    setHeartRate(null);
    setBatteryLevel(null);
    intentionalDisconnectRef.current = false;

    try {
      setIsConnecting(true);
      const bluetooth = navigator.bluetooth;
      if (!bluetooth) {
        throw new Error("Web Bluetooth is not supported in this browser.");
      }
      let device: any = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 'device_information']
      });
      setBleDevice(device);
      device.addEventListener('gattserverdisconnected', onDisconnected);
      await setupGattServer(device);
    } catch (error: any) {
      console.error("BLE Connection failed:", error);
      let msg = "Connection failed.";
      if (error.name === 'NotAllowedError') msg = "Pairing cancelled.";
      else if (error.name === 'NotFoundError') msg = "Device not found.";
      else msg = error.message;
      setConnectionError(msg);
      setBleDevice(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runMedicalAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setIsIngesting(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("file", file));

    try {
      console.log("[SmartCare] Analysis requested. Session status:", status);
      
      if (status === "unauthenticated") {
        toast.error("Session expired. Please log in again.");
        return;
      }

      if (status === "loading") {
        toast.info("Establishing secure session... Please try again in a moment.");
        return;
      }

      const response = await fetch("/api/analyze-record", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Analysis failed (Status: ${response.status}). Please try again.`);
      }

      const data = await response.json();
      
      // Robustly extract the human-readable clinical summary
      const clinicalSummary = typeof data.analysis === 'string' 
        ? data.analysis 
        : (data.analysis?.clinicalSummary || data.analysis?.summary || JSON.stringify(data.analysis || data, null, 2));

      setAnalysisResult(clinicalSummary);
      setFullAnalysisResult(clinicalSummary); // Sync with PDF report preview

      if (data.structuredData) {
        onContextUpdate(data.structuredData);
      }

      setTimeout(() => {
        setAnalysisTab("results");
      }, 2500);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to analyze record.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleResearchSearch = async (queryOverride?: string) => {
    const query = queryOverride || researchQuery;
    if (!query.trim()) return;

    setResearching(true);
    setResearchResult(null);
    setResearchSources([]);

    try {
      const response = await fetch("/api/health-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          medicalContext
        }),
      });

      if (!response.ok) throw new Error("Research failed");

      const data = await response.json();
      setResearchResult(data.report);
      setResearchSources(data.sources || []);
    } catch (err) {
      toast.error("Research failed. Please try again.");
    } finally {
      setResearching(false);
    }
  };

  const cards = [
    {
      id: "records",
      title: "Analyze Medical Records",
      label: "FULL RECORD SCAN",
      description: "Upload your PDFs, X-rays or prescriptions for a deep AI analysis.",
      icon: FileText,
      color: "bg-blue-500",
      content: selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Ready` : "0 Records found"
    },
    {
      id: "research",
      title: "Health Research",
      label: "RESEARCH HUB",
      description: "Search the latest medical findings and clinical research online.",
      icon: Search,
      color: "bg-blue-500",
      content: "Search Online"
    },
    {
      id: "wearables",
      title: "Wearables & IoT",
      label: "LIVE CONNECTION",
      description: "Connect your smart bracelet, watch or scale for real-time monitoring.",
      icon: Watch,
      color: "bg-orange-500",
      content: bleDevice ? "CONNECTED" : "DISCONNECTED"
    }
  ];

  // Safely extract patient summary data with fallbacks
  const ps = medicalContext?.patient_summary;
  const vitals = ps?.latest_vitals;
  const labs = ps?.lab_results;
  const meds = ps?.medications || [];
  const symptoms = ps?.symptoms || [];

  return (
    <div className="relative">
      <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 mb-6 md:mb-10 bg-black/[0.04] dark:bg-white/5 p-1.5 rounded-xl w-full sm:w-fit border border-black/[0.03] dark:border-white/10 shadow-none transition-colors">
        <button
          onClick={() => setAnalysisTab("upload")}
          className={cn(
            "px-6 md:px-8 py-3 md:py-4 rounded-sm text-[10px] md:text-[12px] font-black uppercase tracking-normal transition-all duration-500 relative flex items-center justify-center gap-3 flex-1 sm:flex-none whitespace-nowrap",
            analysisTab === "upload"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-black dark:text-white/80 hover:text-black/70 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <History className={cn("h-4 w-4 md:h-5 md:w-5", analysisTab === "upload" ? "text-white" : "text-black/40 dark:text-white/40")} />
          Medical Records
        </button>
        <button
          onClick={() => setAnalysisTab("results")}
          disabled={!medicalContext}
          className={cn(
            "px-6 md:px-8 py-3 md:py-4 rounded-sm text-[10px] md:text-[12px] font-black uppercase tracking-normal transition-all duration-500 relative flex items-center justify-center gap-3 flex-1 sm:flex-none whitespace-nowrap",
            analysisTab === "results"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-black dark:text-white/80 hover:text-black/70 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5",
            !medicalContext && "opacity-30 cursor-not-allowed"
          )}
        >
          <BarChart3 className={cn("h-4 w-4 md:h-5 md:w-5", analysisTab === "results" ? "text-white" : "text-black/40 dark:text-white/40")} />
          Analysis Results
        </button>
        <button
          onClick={() => setAnalysisTab("professional")}
          className={cn(
            "px-6 md:px-8 py-3 md:py-4 rounded-sm text-[10px] md:text-[12px] font-black uppercase tracking-normal transition-all duration-500 relative flex items-center justify-center gap-3 flex-1 sm:flex-none whitespace-nowrap",
            analysisTab === "professional"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-black dark:text-white/80 hover:text-black/70 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <ShieldCheck className={cn("h-4 w-4 md:h-5 md:w-5", analysisTab === "professional" ? "text-white" : "text-black/40 dark:text-white/40")} />
          Doctor's Advice
          {doctorNotes.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 text-[8px] font-black text-white items-center justify-center">
                {doctorNotes.length}
              </span>
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {analysisTab === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {cards.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ y: -8 }}
                onClick={() => setShowSim(card.id)}
                className="group relative p-6 md:p-8 rounded-3xl md:rounded-4xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden cursor-pointer transition-colors duration-500"
              >
                <div className={cn("absolute -top-12 -right-12 h-32 w-32 blur-[60px] opacity-20", card.color)} />
                <div className="relative z-10 h-full flex flex-col gap-6 md:gap-10">
                  <div className="flex items-start justify-between">
                    <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center", card.color + "10")}>
                      <card.icon className={cn("h-6 w-6 md:h-7 md:w-7", card.color.replace('bg-', 'text-'))} />
                    </div>
                    {card.id === 'wearables' && bleDevice && (
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping absolute top-8 right-12" />
                    )}
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/40 transition-colors">{card.label}</span>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="font-bricolage text-xl md:text-2xl font-extrabold tracking-tight dark:text-white transition-colors">{card.title}</h3>
                    <p className="text-xs md:text-sm font-medium text-black/50 dark:text-white/60 leading-relaxed transition-colors">{card.description}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] md:text-xs font-bold transition-colors",
                      card.id === 'wearables' && bleDevice ? "text-green-500" : "text-black/30 dark:text-white/40"
                    )}>
                      {card.content}
                    </span>
                    <Button size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-black dark:bg-white/10 transform group-hover:scale-110 transition-transform">
                      <Plus className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="md:col-span-2 lg:col-span-3 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 mt-2 md:mt-4 overflow-hidden relative shadow-2xl shadow-primary/5 transition-colors duration-500">
              <div className="absolute top-0 right-0 h-full w-1/2 bg-linear-to-l from-primary/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-4 md:gap-6 flex-1 w-full text-center lg:text-left flex-col lg:flex-row">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl md:rounded-3xl bg-primary/10 flex items-center justify-center">
                  <Activity className={cn("h-7 w-7 md:h-8 md:w-8 text-primary", analyzing && "animate-bounce")} />
                </div>
                <div className="space-y-1" >
                  <h4 className="font-bricolage text-xl md:text-2xl font-bold text-black dark:text-white transition-colors">
                    {analyzing ? `Analyzing... ${progress}%` : "Synthesis Ready"}
                  </h4>
                  <p className="text-black/40 dark:text-white/40 text-[11px] md:text-sm font-medium transition-colors">
                    {analyzing ? "Synthesizing medical history and metrics." : `Your clinical context is ${medicalContext ? "85%" : "0%"} complete.`}
                  </p>
                </div>
              </div>
              <Button
                disabled={analyzing}
                onClick={() => setAnalyzing(true)}
                className="w-full lg:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl bg-black dark:bg-white/10 hover:bg-primary dark:hover:bg-primary text-white font-black text-xs md:text-base shadow-xl shadow-black/25 dark:shadow-none disabled:opacity-50 transition-all duration-300 uppercase tracking-widest"
              >
                {analyzing ? "Scanning..." : "Sync Health Data"}
              </Button>
              {analyzing && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                />
              )}
            </div>
          </motion.div>
        ) : analysisTab === "professional" ? (
          <motion.div
            key="professional"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-4xl border border-black/5 dark:border-white/10 shadow-sm mb-2 transition-colors duration-500">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-6 w-6 md:h-7 md:w-7 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-bricolage text-xl md:text-2xl font-black tracking-tight leading-tight dark:text-white">Professional Advice</h3>
                  <p className="text-[10px] md:text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">Verified Medical Guidance</p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-400px)] pr-2 md:pr-4 no-scrollbar">
              <div className="flex flex-col gap-6 pb-10">
                {doctorNotes.length > 0 ? (
                  doctorNotes.map((note) => (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-white/5 rounded-4xl p-8 md:p-10 border border-black/5 dark:border-white/10 shadow-xl relative overflow-hidden group transition-colors duration-500"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#25D366]/10 transition-colors duration-700" />
                      
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bricolage text-xl font-black dark:text-white">{note.fileName.replace("Doctor Note - ", "") || "Medical Professional"}</h4>
                            <p className="text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-widest mt-0.5">
                              {new Date(note.createdAt).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                          Verified
                        </Badge>
                      </div>

                      <div className="prose prose-sm md:prose-base max-w-none text-black/70 dark:text-white/70 leading-relaxed font-medium bg-black/[0.02] dark:bg-white/5 p-8 rounded-3xl border border-black/5 dark:border-white/10 transition-colors">
                      <div className="prose prose-sm prose-emerald max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {note.extractedText}
                        </ReactMarkdown>
                      </div>
                      </div>

                       <div className="mt-8 flex items-center gap-6 pt-6 border-t border-black/5 dark:border-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#25D366]" />
                          <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">End-to-End Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-black/20 dark:text-white/20" />
                          <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Added to Twin</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-5xl border border-dashed border-black/10 dark:border-white/10 text-center space-y-6 transition-colors duration-500">
                    <div className="h-20 w-20 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="h-10 w-10 text-black/10 dark:text-white/20" />
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <h4 className="font-bricolage text-xl font-black dark:text-white">No assessments yet</h4>
                      <p className="text-sm font-medium text-black/40 dark:text-white/40 leading-relaxed">
                        Once a medical professional reviews your record, their expert advice will appear here.
                      </p>
                    </div>
                     <Button 
                      variant="outline" 
                      onClick={() => setShowSim("records")}
                      className="rounded-2xl border-black/10 dark:border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 dark:text-white"
                    >
                      Invite a Doctor
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-6"
          >
            {/* Clinical Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl md:rounded-4xl border border-black/5 dark:border-white/10 shadow-sm transition-colors duration-500">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="h-6 w-6 md:h-7 md:w-7 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bricolage text-xl md:text-2xl font-black tracking-tight leading-tight">Health Summary</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[9px] md:text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Health Data Connected</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysisTab("upload")}
                  className="flex-1 md:flex-none rounded-2xl border-black/10 dark:border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 dark:text-white h-10 px-4 md:px-6 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 mr-2" />
                  Records
                </Button>
                <div className="h-10 px-4 md:px-6 rounded-2xl bg-black dark:bg-white/10 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/10 dark:shadow-none transition-colors">
                  {ps?.id || "TC-0000"}
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-400px)] pr-2 md:pr-4 no-scrollbar">
              <div className="flex flex-col gap-6 md:gap-8 pb-10">
                {/* Main Stats & Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* AI Clinical Sentiment Card (Markdown Insight) */}
                  <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white border border-black/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                      <Search className="h-32 w-32 md:h-40 md:w-40" />
                    </div>
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-blue-500" />
                        </div>
                        <h4 className="font-bricolage text-lg md:text-xl font-bold">AI Clinical Analysis</h4>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest">Gemini 1.5</Badge>
                    </div>

                      <div className="prose prose-sm md:prose-base max-w-none text-black/70 leading-relaxed overflow-x-hidden">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bricolage font-black tracking-tighter text-black mt-8 mb-4 border-b-2 border-black/5 pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bricolage font-black tracking-tighter text-black mt-6 mb-3 flex items-center gap-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-black text-black mt-6 mb-2" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 text-black/70 font-medium leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="mb-6 space-y-3 list-none p-0" {...props} />,
                            li: ({node, ...props}) => (
                              <li className="flex items-start gap-3 bg-black/2 p-4 rounded-2xl border border-black/5" {...props}>
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Sparkles className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-black/70">{props.children}</span>
                              </li>
                            ),
                            strong: ({node, ...props}) => <strong className="font-black text-black" {...props} />,
                          }}
                        >
                          {analysisResult}
                        </ReactMarkdown>
                      </div>
                  </div>

                  {/* High-Impact Vitals Card */}
                  <div className="p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white border border-black/5 shadow-2xl shadow-black/[0.03] flex flex-col justify-between relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700" />

                    <div className="space-y-6 md:space-y-8 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
                          <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Core Status</span>
                      </div>

                      <div className="space-y-6 md:space-y-8">
                        <div className="flex items-end justify-between border-b border-black/5 pb-4">
                          <div>
                            <p className="text-[9px] md:text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">Blood Pressure</p>
                            <p className="text-2xl md:text-3xl font-bricolage font-black tracking-tighter text-black">{vitals?.blood_pressure || "--"}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] md:text-[10px] uppercase tracking-widest px-2.5 py-1">Stable</Badge>
                        </div>

                        <div className="flex items-end justify-between border-b border-black/5 pb-4">
                          <div>
                            <p className="text-[9px] md:text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">Heart Rate</p>
                            <p className="text-2xl md:text-3xl font-bricolage font-black tracking-tighter text-black">{vitals?.heart_rate || "--"}</p>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary animate-pulse" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-black/[0.02] border border-black/5">
                            <p className="text-[8px] md:text-[9px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">Temp</p>
                            <p className="text-lg md:text-xl font-black text-black">{vitals?.temperature || "--"}</p>
                          </div>
                          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-black/[0.02] border border-black/5">
                            <p className="text-[8px] md:text-[9px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">BMI</p>
                            <p className="text-lg md:text-xl font-black text-black">{vitals?.bmi || "--"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowAnalysisModal(true)}
                      disabled={!analysisResult && !fullAnalysisResult}
                      className="mt-8 w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-black hover:bg-primary text-white font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-2xl shadow-black/20 border-none group hover:scale-[1.02] transition-all"
                    >
                      Health Report PDF
                      <FileDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                    </Button>
                  </div>
                </div>

                {/* Secondary Diagnostics & Therapeutics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Detailed Lab Matrix */}
                  <div className="p-6 md:p-8 rounded-3xl md:rounded-[3rem] bg-white border border-black/5 shadow-sm space-y-6 md:space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-vital-orange/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 md:h-6 md:w-6 text-vital-orange" />
                        </div>
                        <div>
                          <h4 className="font-bricolage text-lg md:text-xl font-bold">Lab Matrix</h4>
                          <p className="text-[10px] md:text-xs font-medium text-black/30">Validated Clinical Markers</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="h-7 md:h-8 rounded-full border-black/5 text-black/40 font-bold px-3 md:px-4 text-[10px]">Latest</Badge>
                    </div>

                    <div className="space-y-4">
                      {/* Featured Lab Result */}
                      <div className="p-5 md:p-6 rounded-2xl md:rounded-4xl bg-vital-orange/[0.03] border border-vital-orange/10 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[9px] md:text-[10px] font-black text-vital-orange uppercase tracking-widest">Malaria MP Test</p>
                          <p className="text-xl md:text-2xl font-bricolage font-black tracking-tight">{labs?.malaria_test_mp || "Pending"}</p>
                        </div>
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-vital-orange/20 flex items-center justify-center animate-pulse">
                          <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-vital-orange shadow-[0_0_10px_#f97316]" />
                        </div>
                      </div>

                      <div className="p-5 md:p-6 rounded-2xl md:rounded-4xl bg-red-50/30 border border-red-100/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-black/40 uppercase tracking-widest">Widal Serology</span>
                          <Badge className="bg-red-100 text-red-600 border-none font-black text-[9px] uppercase tracking-widest">{labs?.widal_test || "N/A"}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {labs?.titers ? Object.entries(labs.titers).map((entry: any) => (
                            <div key={entry[0]} className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-black/5 shadow-sm">
                              <span className="text-[9px] font-bold text-black/40 tracking-wider">T-{entry[0]}</span>
                              <div className="h-3 w-px bg-black/10" />
                              <span className="text-[10px] font-black text-red-500">{entry[1]}</span>
                            </div>
                          )) : (
                            <p className="text-[9px] font-medium text-black/20 italic">No specific titers available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Therapeutic Regimen */}
                  <div className="p-6 md:p-8 rounded-3xl md:rounded-[3rem] bg-white border border-black/5 shadow-sm space-y-6 md:space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center">
                          <Pill className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-bricolage text-lg md:text-xl font-bold">Therapeutic Regimen</h4>
                          <p className="text-[10px] md:text-xs font-medium text-black/30">Active Medications</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {meds.length > 0 ? meds.map((med: any, i: number) => (
                        <div key={i} className="group flex items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-4xl bg-blue-50/20 border border-blue-100/30 hover:bg-blue-50/40 transition-all cursor-pointer">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                              <div className="h-5 w-5 md:h-6 md:w-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm md:text-base font-black tracking-tight">{med.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Clock className="h-2.5 w-2.5 text-black/20" />
                                <span className="text-[9px] md:text-[10px] font-bold text-black/30 uppercase tracking-widest">{med.dosage} - {med.frequency}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-black/10 transition-transform group-hover:translate-x-1" />
                        </div>
                      )) : (
                        <p className="text-xs font-medium text-black/20 p-6 text-center italic">No current medications listed</p>
                      )}
                    </div>

                    <div className="p-5 md:p-6 rounded-2xl md:rounded-4xl border-2 border-dashed border-black/5 bg-black/[0.01] flex items-center justify-between group cursor-pointer hover:border-black/10 transition-all">
                      <div className="flex items-center gap-3">
                        <Plus className="h-4 w-4 md:h-5 md:w-5 text-black/20 group-hover:text-black/40 transition-colors" />
                        <span className="text-[10px] font-black text-black/20 group-hover:text-black/40 uppercase tracking-widest">Add OTC Medication</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Insights Summary Card */}
                <div className="p-8 md:p-12 rounded-3xl md:rounded-5xl bg-linear-to-br from-blue-900 to-blue-950 border border-blue-500/20 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group shadow-2xl shadow-blue-500/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000" />
                  <div className="h-20 w-20 md:h-28 md:w-28 rounded-[2.5rem] bg-white flex items-center justify-center shadow-2xl shadow-black/20 shrink-0 relative z-10 transition-transform group-hover:scale-105 duration-700">
                    <User className="h-10 w-10 md:h-14 md:w-14 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
                    <h3 className="font-bricolage text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">Patient Synopsis</h3>
                    <p className="text-lg md:text-2xl font-medium text-blue-100/60 leading-relaxed max-w-2xl px-2 md:px-0">
                      Our intelligence platform suggests a primary diagnosis of <span className="text-blue-300 font-black underline decoration-blue-300/30 underline-offset-8">{ps?.diagnosis || "Analyzing Context..."}</span>.
                      We&apos;ve mapped <span className="text-blue-300 font-bold">{symptoms.length || 0} neurological & clinical markers</span> corresponding to this profile.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                      <Button className="h-14 px-8 rounded-2xl bg-white text-blue-950 hover:bg-blue-50 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/20">
                        View Detailed Log
                      </Button>
                      <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/20 text-white hover:bg-white/5 font-black text-xs uppercase tracking-[0.2em]">
                        Share with MD
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Simulation Overlay */}
      <AnimatePresence>
        {showSim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "bg-white dark:bg-[#0a0a0a] p-6 md:p-10 w-full max-w-5xl shadow-2xl relative flex flex-col h-[calc(100vh-140px)] sm:h-[80vh] rounded-3xl overflow-hidden border border-black/5 dark:border-white/10",
                showSim === "research" && "sm:rounded-[2rem]"
              )}
            >
              <button
                onClick={() => setShowSim(null)}
                className="absolute top-4 right-4 md:top-8 md:right-8 h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-20"
              >
                <X className="h-5 w-5 md:h-6 md:w-6 text-black dark:text-white" />
              </button>

              {showSim === "records" && (
                <div className="space-y-6 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-3xl font-bricolage font-black text-black dark:text-white">Medical Records</h2>
                        <p className="text-[10px] md:text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Upload or scan your documents</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                    {/* Left Side: Upload / File List */}
                    <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-24 sm:pb-0">
                      {/* Action Buttons */}                      {/* Ingestion Zone */}
                      <div
                        className="relative group cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-primary');
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            setSelectedFiles(prev => [...prev, ...files]);
                          }
                        }}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-primary rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                        <div className="relative grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="h-36 rounded-[2rem] border-2 border-dashed border-blue-200 dark:border-blue-500/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm flex flex-col gap-3 group/btn hover:bg-blue-50/50 dark:hover:bg-blue-500/10 hover:border-blue-400 transition-all font-black text-[10px] uppercase tracking-widest text-black dark:text-white"
                          >
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                              <FileUp className="h-6 w-6 text-blue-500" />
                            </div>
                            <span>Upload Files</span>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              multiple
                              accept="image/*,application/pdf"
                              className="hidden"
                            />
                          </Button>
                          <Button
                            onClick={() => cameraInputRef.current?.click()}
                            variant="outline"
                            className="h-36 rounded-[2rem] border-2 border-dashed border-primary/20 dark:border-primary/40 bg-white/50 dark:bg-white/5 backdrop-blur-sm flex flex-col gap-3 group/btn hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary transition-all font-black text-[10px] uppercase tracking-widest text-black dark:text-white"
                          >
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                              <Camera className="h-6 w-6 text-primary" />
                            </div>
                            <span>Snap Record</span>
                            <input
                              type="file"
                              ref={cameraInputRef}
                              onChange={handleFileSelect}
                              multiple
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                            />
                          </Button>
                        </div>
                      </div>


                      {/* File Queue */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Ready for Analysis</h4>
                        <AnimatePresence>
                          {selectedFiles.length === 0 ? (
                            <div className="py-10 text-center rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/5 flex flex-col items-center justify-center gap-2">
                              <p className="text-xs font-bold text-black/20 dark:text-white/20 uppercase tracking-widest">No files added yet</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {selectedFiles.map((file, i) => (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  key={i}
                                  className="p-4 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between group hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 transition-all"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/10 shadow-inner">
                                      {file.type.startsWith('image/') ? (
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt="preview"
                                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                      ) : (
                                        <FileText className="h-6 w-6 text-white/40" />
                                      )}
                                    </div>
                                    <div className="max-w-[140px]">
                                      <p className="text-sm font-black text-black dark:text-white truncate tracking-tight">{file.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        <p className="text-[10px] text-black/30 dark:text-white/30 font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(0)} KB</p>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                    className="h-12 w-12 rounded-2xl text-black/10 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-auto space-y-4">
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20">
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-tight">Stored Knowledge</p>
                          <p className="text-xs font-medium text-black/60 dark:text-white/60 mt-1">Your records will be analyzed to help our AI understand your health better.</p>
                        </div>

                        <Button
                          onClick={runMedicalAnalysis}
                          disabled={selectedFiles.length === 0 || isIngesting}
                          className="w-full h-14 rounded-xl bg-black dark:bg-white/10 text-white hover:bg-blue-600 dark:hover:bg-blue-600 shadow-xl shadow-black/10 dark:shadow-none font-bold"
                        >
                          {isIngesting ? "Reading documents..." : "Start Analysis"}
                        </Button>
                      </div>
                    </div>

                    {/* Right Side: Analysis View */}
                    <div className="flex flex-col rounded-3xl border border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/5 overflow-hidden">
                      <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 bg-white dark:bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-black/60 dark:text-white/60">Live Analysis</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold">Analysis Output</Badge>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white/50 dark:bg-white/5">
                        {isIngesting ? (
                          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            <p className="text-sm font-bold text-black/40 dark:text-white/40">Reading your medical documents...</p>
                          </div>
                        ) : analysisResult ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-sm font-medium text-black/80 dark:text-white/80 max-w-none prose-p:leading-relaxed prose-headings:font-bricolage prose-headings:font-extrabold dark:prose-invert"
                          >
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{analysisResult}</ReactMarkdown>
                            </div>
                          </motion.div>
                        ) : analysisError ? (
                          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                              <X className="h-8 w-8 text-red-500" />
                            </div>
                            <h4 className="font-bold text-red-600 dark:text-red-400">Analysis Error</h4>
                            <p className="text-sm text-red-500/60 dark:text-red-400/60 mt-2">{analysisError}</p>
                            <Button variant="outline" onClick={() => setSelectedFiles([])} className="mt-6 rounded-xl border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Clear and Retry</Button>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                            <div className="h-16 w-16 rounded-full bg-black/[0.02] dark:bg-white/5 flex items-center justify-center mb-6 border-2 border-dashed border-black/10 dark:border-white/10">
                              <Bot className="h-6 w-6 text-black/10 dark:text-white/20" />
                            </div>
                            <h4 className="text-lg font-bold text-black/40 dark:text-white/40">Waiting for Documents</h4>
                            <p className="text-sm text-black/20 dark:text-white/20 font-medium max-w-[240px] mx-auto mt-2">Upload medical records to generate your health summary.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showSim === "wearables" && (
                <div className="space-y-8 min-h-[500px] flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                      <Watch className="h-7 w-7 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bricolage font-extrabold tracking-tight text-black dark:text-white">Wearable Sync</h2>
                      <p className="text-black/50 dark:text-white/50 font-medium">{bleDevice ? `Live data from ${bleDevice.name}` : 'Connect your smart bracelet via Bluetooth'}</p>
                    </div>
                  </div>

                  {!bleDevice && !isConnecting ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-10 py-10"
                    >
                      {/* Radar Animation */}
                      <div className="relative h-48 w-48 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-orange-500/20 border border-orange-500/30"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
                          className="absolute inset-0 rounded-full bg-orange-500/10 border border-orange-500/20"
                        />
                        <div className="relative z-10 h-24 w-24 rounded-full bg-white dark:bg-white/5 shadow-2xl flex items-center justify-center border border-orange-100 dark:border-orange-500/20">
                          <Watch className="h-10 w-10 text-orange-500" />
                        </div>
                      </div>

                      <div className="text-center space-y-3 max-w-sm">
                        <h4 className="text-xl font-bold font-bricolage text-black dark:text-white">Ready to pair</h4>
                        <p className="text-sm font-medium text-black/40 dark:text-white/40">Ensure your TakeCare bracelet is turned on and within 3 feet of this device.</p>
                        {connectionError && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold mt-2"
                          >
                            ⚠️ {connectionError}
                          </motion.div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {[
                          { step: "01", label: "Turn on BT" },
                          { step: "02", label: "Keep Proximity" },
                          { step: "03", label: "Accept Pairing" }
                        ].map((s) => (
                          <div key={s.step} className="p-4 rounded-2xl bg-black/2 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{s.step}</span>
                            <span className="text-xs font-bold text-black/60 dark:text-white/60">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-4 w-full max-w-xs">
                        <Button
                          onClick={connectDevice}
                          className="h-14 px-12 rounded-2xl bg-orange-600 text-white hover:bg-orange-700 shadow-xl shadow-orange-500/25 font-bold text-lg group w-full"
                        >
                          Start Scanning
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <p className="text-[10px] text-center text-black/30 dark:text-white/30 font-medium">
                          Tip: If it&apos;s connected to your phone&apos;s app, disconnect it there first.
                        </p>
                      </div>
                    </motion.div>
                  ) : bleDevice ? (
                    <div className="space-y-8 flex-1 overflow-y-auto pb-24 sm:pb-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Activity, label: "Heart Rate", val: heartRate || "--", unit: "bpm", color: "text-red-500", live: !!heartRate },
                          { icon: Zap, label: "Battery", val: batteryLevel || "--", unit: "%", color: "text-yellow-500", live: !!batteryLevel },
                          { icon: Watch, label: "Steps", val: "Mock", unit: "", color: "text-blue-500", live: false },
                          { icon: Bot, label: "Stress", val: "Mock", unit: "", color: "text-green-500", live: false }
                        ].map((metric, i) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={metric.label}
                            className={cn(
                              "p-6 rounded-3xl bg-black/5 dark:bg-white/5 flex flex-col items-center text-center gap-2 border transition-all",
                              metric.live ? "border-red-200 dark:border-red-500/20 shadow-lg shadow-red-500/5 dark:shadow-none bg-red-50/30 dark:bg-red-500/10" : "border-transparent"
                            )}
                          >
                            <metric.icon className={cn("h-6 w-6 mb-2", metric.color, metric.live && "animate-pulse")} />
                            <span className="text-2xl font-black font-bricolage text-black dark:text-white">{metric.val}</span>
                            <span className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">{metric.label} {metric.unit}</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="p-8 rounded-4xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-500/20 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                            <Watch className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-green-900 dark:text-green-400">{bleDevice.name || "Smart Bracelet"}</p>
                                      <p className="text-xs text-green-700/60 dark:text-green-300/60 font-medium flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Linked and Transmitting
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleDisconnect}
                          className="rounded-xl border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                      <div className="h-24 w-24 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
                      <div className="text-center">
                        <h4 className="text-xl font-bold font-bricolage text-black dark:text-white">Searching for devices</h4>
                        <p className="text-sm font-medium text-black/40 dark:text-white/40">Please follow the browser instructions...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showSim === "research" && (
                <div className="flex flex-col h-full min-h-0 overflow-hidden">
                  {/* Simple Header */}
                  <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-3xl font-bricolage font-black text-black dark:text-white">Health Research</h2>
                        <p className="text-[10px] md:text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Search online for medical info</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Search Area */}
                  <div className="mb-6 shrink-0">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleResearchSearch();
                      }}
                      className="relative"
                    >
                      <div className="relative flex items-center">
                        <Input
                          placeholder="Search for symptoms or conditions..."
                          value={researchQuery}
                          onChange={(e) => setResearchQuery(e.target.value)}
                          className="h-12 md:h-14 rounded-2xl border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 pl-6 pr-16 text-sm md:text-lg font-bold placeholder:text-black/30 dark:placeholder:text-white/30 outline-none text-black dark:text-white"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Button 
                            type="submit"
                            disabled={researching || !researchQuery.trim()}
                            className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                          >
                            {researching ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Content Area - Forced Scroll Region */}
                  <div className="flex-1 h-0 min-h-0 overflow-y-auto px-2 pb-12 sm:pb-6 scrollbar-thin scrollbar-thumb-blue-600/20 scrollbar-track-transparent">
                    <div className="space-y-6">
                      {researching ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-black dark:text-white">Searching for research...</h3>
                            <p className="text-xs font-medium text-black/40 dark:text-white/40">Fetching latest results from medical sources</p>
                          </div>
                        </div>
                      ) : researchResult ? (
                        <motion.div 
                          key="results"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 pb-24"
                        >
                          {/* Clean Report View */}
                          <div ref={researchReportRef} className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden relative">
                            <div className="h-1.5 w-full bg-blue-600" />
                            
                            <div className="p-4 md:p-8 lg:p-10">
                              <div className="border-b border-black/5 dark:border-white/10 pb-6 mb-6">
                                <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">Research Summary</span>
                                <h3 className="text-xl md:text-3xl font-bricolage font-black text-black dark:text-white">
                                  Findings: {researchQuery}
                                </h3>
                              </div>
                              <div className="prose prose-sm md:prose-base max-w-none text-black/70 dark:text-white/70 leading-relaxed dark:prose-invert">
                                <ReactMarkdown
                                  components={{
                                    h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-bold text-black dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                    ul: ({node, ...props}) => <ul className="space-y-3 my-4" {...props} />,
                                    li: ({node, ...props}) => (
                                      <li className="bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/10 p-4 rounded-xl flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                        <div className="text-sm md:text-base font-medium text-black/80 dark:text-white/80">{props.children}</div>
                                      </li>
                                    ),
                                  }}
                                >
                                  {researchResult}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                          
                          {/* Desktop/Mobile Actions */}
                          <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button 
                              onClick={handleDownloadResearchPDF}
                              className="flex-1 h-14 md:h-16 rounded-2xl bg-black dark:bg-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-400 text-white font-bold shadow-lg shadow-black/10 transition-all active:scale-95"
                            >
                              <FileDown className="mr-3 h-5 w-5" />
                              Save research as PDF
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setResearchResult(null);
                                setResearchQuery("");
                              }}
                              className="flex-1 h-14 md:h-16 rounded-2xl border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-black dark:text-white font-bold hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              New Search
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="trending"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-black/20" />
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Recent & Popular</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 sm:pb-0">
                            {[
                              { topic: "Sleep & Vitamin D", desc: "Latest info on sleep quality" },
                              { topic: "Heart Health", desc: "New cardio research" },
                            ].map((item) => (
                              <div 
                                key={item.topic} 
                                onClick={() => {
                                  setResearchQuery(item.topic);
                                  handleResearchSearch(item.topic);
                                }}
                                className="group p-6 rounded-2xl bg-white border border-black/10 flex flex-col items-start gap-4 hover:border-blue-600/50 transition-all cursor-pointer"
                              >
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <Search className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors">{item.topic}</h4>
                                  <p className="text-[10px] font-medium text-black/40">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Analysis Results Preview Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-[98vw] lg:max-w-5xl xl:max-w-6xl h-[92vh] lg:h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2rem] lg:rounded-[3rem] border-none shadow-2xl backdrop-blur-3xl bg-white/95">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

          <DialogHeader className="px-6 py-6 lg:px-12 lg:py-10 bg-white border-b border-black/5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
              <div className="h-14 w-14 lg:h-20 lg:w-20 rounded-2xl lg:rounded-[2rem] bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
                <ShieldCheck className="h-7 w-7 lg:h-10 lg:w-10 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="font-bricolage text-2xl lg:text-5xl font-black tracking-tighter text-black leading-tight">Health Synthesis Report</DialogTitle>
                <DialogDescription className="text-black/40 font-bold text-[10px] lg:text-base uppercase tracking-widest">Verified by TakeCare Clinical Intelligence</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 lg:p-12 bg-black/[0.02]">
            <article
              id="takecare-pdf-report"
              ref={reportRef}
              className="bg-white p-6 lg:p-20 rounded-[2rem] lg:rounded-[4rem] border border-black/5 shadow-2xl shadow-black/[0.02] max-w-none min-h-full flex flex-col"
            >
              {/* Report Header Logo & Title */}
              <div className="flex justify-between items-start border-b-[3px] border-black pb-10 mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter">TakeCare</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bricolage font-black tracking-tighter text-black uppercase mt-4">Clinical Synthesis</h1>
                  <p className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Precision Intelligence Record</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    Verified Analysis
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Generated On</p>
                  <p className="text-lg font-bold text-black">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Patient Identity Section */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 p-8 rounded-2xl bg-black/[0.02] border border-black/5 mb-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">Subject Name</p>
                  <p className="text-xl font-black text-black">{userName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">Record Number</p>
                  <p className="text-xl font-bold text-black font-mono">#{patientId?.slice(-6).toUpperCase() || "PAT-001"}</p>
                </div>
                <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-black/5 pt-6 lg:pt-0 lg:pl-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">Report Status</p>
                  <p className="text-sm font-black text-blue-600 uppercase">Active Updates</p>
                </div>
              </div>

              {/* Clinical Analysis Content */}
              <div className="flex-1 prose prose-sm md:prose-base lg:prose-xl max-w-none prose-headings:font-bricolage prose-headings:text-black prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-p:text-black/80 prose-p:leading-relaxed prose-strong:text-black prose-strong:font-black prose-ul:list-disc prose-li:text-black/70">
                {fullAnalysisResult && (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ node, children, ...props }) => <p className="mb-4 leading-relaxed" {...props}>{children}</p>,
                        ul: ({ node, children, ...props }) => <ul className="space-y-2 mb-4 list-disc pl-4" {...props}>{children}</ul>,
                        li: ({ node, children, ...props }) => <li className="text-black/70" {...props}>{children}</li>,
                        h3: ({ node, children, ...props }) => <h3 className="text-lg font-bold mb-2" {...props}>{children}</h3>,
                      }}
                    >
                      {fullAnalysisResult}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Professional Footer */}
              <div className="mt-12 pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest">TakeCare Health System</p>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">TakeCare © 2026</p>
              </div>
            </article>
          </div>

          <DialogFooter className="px-6 py-6 lg:px-12 lg:py-8 bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowAnalysisModal(false)}
              className="w-full sm:w-auto rounded-2xl border-black/10 dark:border-white/10 font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] px-10 h-14 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-outfit text-black dark:text-white"
            >
              Close Preview
            </Button>
            <div className="w-full sm:w-auto flex items-center gap-3">
              <Button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="w-full sm:w-auto rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-primary dark:hover:bg-blue-400 font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] px-12 h-14 group transition-all shadow-xl shadow-black/20 dark:shadow-none font-outfit"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
