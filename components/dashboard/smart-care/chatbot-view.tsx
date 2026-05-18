"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { 
  ArrowUp,
  Plus,
  Paperclip,
  Wand2,
  Stethoscope,
  Microscope,
  FileSearch,
  MessageSquarePlus,
  ChevronUp,
  History,
  Activity,
  Search,
  ShieldCheck,
  Bot,
  Zap,
  Brain,
  Loader2,
  ArrowRight,
  SendHorizontal,
  Command,
  Globe,
  ArrowUpRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { SYNTHETIC_DOCTOR_DATA } from "@/lib/doctor-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatbotViewProps {
  userName: string;
  messages: any[];
  sendMessage: (message: { text: string }) => Promise<void>;
  status: string;
  setMessages: (messages: any[]) => void;
}

export function ChatbotView({ 
  userName, 
  messages, 
  sendMessage, 
  status,
  setMessages 
}: ChatbotViewProps) {
  const { data: session } = useSession();
  const isLoading = status === "submitting" || status === "submitted" || status === "streaming";
  
  const [localInput, setLocalInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<any[]>([]);
  const [thinkingStep, setThinkingStep] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const timer1 = setTimeout(() => setThinkingStep(1), 1200);
    const timer2 = setTimeout(() => setThinkingStep(2), 2400);
    const timer3 = setTimeout(() => setThinkingStep(3), 3600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading]);

  const tools = [
    { id: "records", label: "Medical History", icon: History, prompt: "[DIRECTIVE: Access and analyze Hilium medical records for relevant patient history.]" },
    { id: "vitals", label: "Check Vitals", icon: Activity, prompt: "[DIRECTIVE: Retrieve and interpret latest vitals from the patient profile.]" },
    { id: "notes", label: "Doctor Notes", icon: FileSearch, prompt: "[DIRECTIVE: Examine clinical consultation notes and doctor observations.]" },
    { id: "literature", label: "Medical Research", icon: Microscope, prompt: "[DIRECTIVE: Research medical literature for current evidence-based guidance on this topic.]" },
  ];

  const suggestions = [
    "Analyze my latest blood work",
    "Compare my vitals to last month",
    "Summarize my recent consultations",
    "Explain my current medications"
  ];

  const handleToolSelect = (tool: any) => {
    setSelectedTools(prev => {
      const exists = prev.find(t => t.id === tool.id);
      if (exists) return prev.filter(t => t.id !== tool.id);
      return [...prev, tool];
    });
    setIsToolMenuOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() && selectedTools.length === 0) return;
    if (isLoading) return;

    // Construct a structured message
    const instructions = selectedTools.map(t => t.prompt).join("\n");
    const messageToSend = `
${selectedTools.length > 0 ? "### SYSTEM INSTRUCTIONS\n" + instructions + "\n\n" : ""}
### USER QUERY
${localInput.trim()}
`.trim();
    
    setLocalInput("");
    // We do NOT clear selectedTools anymore, as requested by user

    try {
      if (typeof sendMessage === "function") {
        sendMessage({ text: messageToSend });
      }
    } catch (error) {
      setLocalInput(localInput);
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 min-h-[600px] lg:h-[750px] w-full md:w-full bg-[#fcfcfc] dark:bg-[#0a0a0a] rounded-none md:rounded-[3.5rem] border-x-0 md:border border-black/10 dark:border-white/10 overflow-hidden relative shadow-none"
    >
      {/* Dynamic Chat Header */}
      <div className="px-4 md:px-10 py-4 md:py-6 border-b border-black/[0.03] dark:border-white/[0.03] bg-white/40 dark:bg-black/40 backdrop-blur-3xl flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-lg shadow-primary/10 rotate-3 border-2 border-white">
              <img 
                src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                alt="Dr. Leo" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bricolage font-black text-xl tracking-tight text-black dark:text-white">Dr. Leo</h3>
              <Badge className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-widest px-2 py-0">Active Intelligence</Badge>
            </div>
            <p className="text-[11px] font-bold text-black/60 dark:text-white/60 uppercase tracking-[0.1em]">Verified Health Assistant • Encryption Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-black/20 dark:text-white/20 uppercase tracking-widest">Connection Status</span>
            <span className="text-xs font-black text-black dark:text-white flex items-center gap-2">
              <Globe className="h-3 w-3 text-green-500" /> Ultra-Low Latency
            </span>
          </div>
          <div className="h-10 w-px bg-black/[0.05] dark:bg-white/[0.05]" />
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <History className="h-5 w-5 text-black/40 dark:text-white/40" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area - Flex-1 ensures it takes all available space above the dock */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full px-0.5 md:px-10" ref={scrollAreaRef}>
          <div className="flex flex-col gap-6 md:gap-10 max-w-6xl mx-auto w-full pt-6 pb-40 md:pb-10">
            {messages.length <= 1 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-32 w-32 rounded-[2.5rem] overflow-hidden mb-8 border-2 border-black/10 dark:border-white/10 rotate-2 transition-transform hover:rotate-0 duration-500">
                  <img 
                    src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                    alt="Dr. Leo" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <h4 className="text-3xl font-bricolage font-black text-black dark:text-white mb-4">Start your Consultation</h4>
                <p className="text-black/80 dark:text-white/80 font-medium max-w-sm mb-10 leading-relaxed">
                  I have full access to your medical records. Ask me anything about your health history, vitals, or symptoms.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {suggestions.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => setLocalInput(text)}
                      className="flex items-center justify-between p-4 md:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f0f0f] hover:border-primary/40 hover:bg-primary/5 transition-all group text-left shadow-none"
                    >
                      <span className="text-sm font-bold text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white">{text}</span>
                      <ArrowUpRight className="h-4 w-4 text-black/20 dark:text-white/20 group-hover:text-primary transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn(
                  "flex flex-col md:flex-row md:items-end gap-2 md:gap-3 mb-8 md:mb-10 w-full",
                  msg.role === "user" ? "items-end md:flex-row-reverse" : "items-start md:flex-row"
                )}
              >
                {/* Avatar Wrapper - Small and above the bubble on mobile */}
                <div className="flex items-center gap-2 mb-1 md:mb-0 md:contents">
                  <Avatar className={cn(
                    "h-6 w-6 md:h-10 md:w-10 border-2 shadow-sm shrink-0",
                    msg.role === "user" ? "border-primary/20" : "border-white dark:border-white/10"
                  )}>
                    {msg.role === "assistant" ? (
                      <>
                        <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Leo" />
                        <AvatarFallback className="bg-primary text-white text-[10px] font-black">LEO</AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={session?.user?.image || ""} alt={userName} />
                        <AvatarFallback className="bg-black text-white text-[10px] font-black">
                          {userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <span className="md:hidden text-[9px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
                    {msg.role === "user" ? "You" : "Dr. Leo"}
                  </span>
                </div>

                <div
                  className={cn(
                    "w-[99%] md:max-w-[85%] px-5 md:px-8 py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] relative group",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary via-primary to-[#0047FF] text-white rounded-tr-none md:rounded-tr-none shadow-none"
                      : "bg-white dark:bg-[#0f0f0f] text-black/80 dark:text-white/80 rounded-tl-none md:rounded-tl-none border border-black/10 dark:border-white/10 shadow-none"
                  )}
                >
                  {/* Check for parts (AI SDK v6) */}
                  {msg.parts ? (
                    <div className="flex flex-col gap-4">
                      {msg.parts.map((part: any, i: number) => {
                        if (part.type === "text") {
                          return (
                            <div
                              key={i}
                              className={cn(
                                "prose prose-base md:prose-lg max-w-none font-medium leading-[1.6]",
                                msg.role === "user" ? "prose-invert" : "prose-slate"
                              )}
                            >
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
                                  li: ({node, ...props}) => <li className="mb-2" {...props} />,
                                }}
                              >
                                {msg.role === "user" && part.text.includes("### USER QUERY") 
                                  ? part.text.split("### USER QUERY")[1].trim() 
                                  : part.text}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        if (part.type === "tool-invocation") {
                          const call = part.toolInvocation;
                          return (
                            <div
                              key={i}
                              className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-black/5 dark:border-white/5 flex items-center gap-4 group/tool overflow-hidden relative"
                            >
                              <div className="h-12 w-12 rounded-2xl bg-white/80 dark:bg-black/80 flex items-center justify-center shadow-sm relative z-10">
                                {call.toolName.toLowerCase().includes("history") ? (
                                  <History className="h-6 w-6 text-primary" />
                                ) : call.toolName.toLowerCase().includes("vital") ? (
                                  <Activity className="h-6 w-6 text-primary" />
                                ) : (
                                  <Search className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div className="flex flex-col relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30 mb-1">
                                  {call.state === "result" ? "Query Completed" : "Medical Logic Step"}
                                </span>
                                <span className="text-sm font-black text-black/70 dark:text-white/70">
                                  {call.toolName === "searchMedicalHistory" && "Scanning Clinical Archives"}
                                  {call.toolName === "getLatestVitals" && "Accessing Vital Telemetry"}
                                  {call.toolName === "searchMedicalLiterature" && "Consulting Research Nodes"}
                                  {call.toolName === "getDoctorNotes" && "Decoding Clinical Insights"}
                                  {call.toolName === "searchVoiceHistory" && "Analyzing Audio Transcripts"}
                                </span>
                              </div>
                              {call.state === "result" ? (
                                <div className="ml-auto relative z-10">
                                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                  </div>
                                </div>
                              ) : (
                                <div className="ml-auto relative z-10">
                                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "prose prose-base md:prose-lg max-w-none font-medium leading-[1.6]",
                        msg.role === "user" ? "prose-invert" : "prose-slate"
                      )}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center gap-3 px-6",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className="text-[9px] font-black text-black/10 dark:text-white/10 uppercase tracking-[0.2em] transition-opacity group-hover:opacity-100 opacity-0">
                    {msg.role === "user" ? "Sent by You" : "Origin: Dr. Leo"}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-black/5 dark:bg-white/5" />
                  <span className="text-[9px] font-black text-black/10 dark:text-white/10 uppercase tracking-[0.2em]">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-[99%] md:max-w-[85%] bg-white dark:bg-[#0f0f0f] border border-black/10 dark:border-white/10 rounded-[2rem] p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Hilium Clinical Insight Core</span>
                  <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider ml-auto">Active Reasoning</span>
                </div>

                <div className="space-y-3 pl-2.5 border-l border-black/[0.08] dark:border-white/[0.08]">
                  {/* Step 1: Tool scan */}
                  <motion.div 
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-xs font-semibold text-black/60 dark:text-white/60"
                  >
                    {thinkingStep === 0 ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    )}
                    <span className={cn(thinkingStep === 0 && "text-black dark:text-white font-bold")}>
                      {thinkingStep === 0 ? "Using Tool: Accessing secure patient medical history booklet..." : "Accessed medical records booklet successfully"}
                    </span>
                  </motion.div>

                  {/* Step 2: Telemetry analysis */}
                  {thinkingStep >= 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 text-xs font-semibold text-black/60 dark:text-white/60"
                    >
                      {thinkingStep === 1 ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      )}
                      <span className={cn(thinkingStep === 1 && "text-black dark:text-white font-bold")}>
                        {thinkingStep === 1 ? "Using Tool: Examining clinical vital signs and doctor consultations..." : "Extracted vital telemetry and expert consultations"}
                      </span>
                    </motion.div>
                  )}

                  {/* Step 3: Medical Literature scan */}
                  {thinkingStep >= 2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 text-xs font-semibold text-black/60 dark:text-white/60"
                    >
                      {thinkingStep === 2 ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      )}
                      <span className={cn(thinkingStep === 2 && "text-black dark:text-white font-bold")}>
                        {thinkingStep === 2 ? "Using Tool: Querying peer-reviewed medical research literature..." : "Synthesized medical research node insights"}
                      </span>
                    </motion.div>
                  )}

                  {/* Step 4: Final clinical guidance synthesis */}
                  {thinkingStep >= 3 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 text-xs font-semibold text-black/60 dark:text-white/60"
                    >
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      <span className="text-black dark:text-white font-bold">
                        Formulating verified evidence-based health guidance...
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        {/* Subtle Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      </div>

      {/* Persistent Smart Input Dock - Fixed on mobile, sticky at bottom on desktop */}
      <div className="fixed bottom-[90px] left-2 right-2 z-40 md:relative md:bottom-auto md:left-auto md:right-auto px-2 md:px-10 pb-4 md:pb-8 pt-4 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 md:border-x-0 md:border-b-0 md:border-t md:border-black/[0.03] md:dark:border-white/[0.03] rounded-[2.5rem] md:rounded-none shadow-none">
        
        {/* Selected Tool Indicator - Floats above the input dock */}
        <div className="absolute -top-12 left-10 right-10 flex justify-center z-30 pointer-events-none">
          <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
            <AnimatePresence>
              {selectedTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-full border border-white/20 whitespace-nowrap shadow-none"
                >
                  <tool.icon className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{tool.label}</span>
                  <button 
                    onClick={() => setSelectedTools(prev => prev.filter(t => t.id !== tool.id))}
                    className="ml-0.5 h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative group max-w-6xl mx-auto">
          
          <form 
            onSubmit={onFormSubmit}
            className="relative bg-white/85 dark:bg-[#0f0f0f]/85 backdrop-blur-3xl border border-black/10 dark:border-white/10 p-2 rounded-[2.5rem] flex items-center gap-2 group-focus-within:border-primary/40 transition-all duration-500 shadow-none"
          >
            <DropdownMenu open={isToolMenuOpen} onOpenChange={setIsToolMenuOpen}>
              <DropdownMenuTrigger>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-14 w-14 rounded-[1.8rem] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all shrink-0"
                >
                  <Plus className={cn("h-6 w-6 text-black/40 dark:text-white/40 transition-transform duration-500", isToolMenuOpen && "rotate-45 text-primary")} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-72 p-3 rounded-3xl border-black/5 dark:border-white/5 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl mb-4"
              >
                <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Diagnostic Tools</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5" />
                <div className="grid gap-2 p-2">
                  {tools.map((tool) => {
                    const isActive = selectedTools.find(t => t.id === tool.id);
                    return (
                      <DropdownMenuItem 
                        key={tool.id} 
                        onClick={() => handleToolSelect(tool)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors group/item",
                          isActive ? "bg-primary text-white" : "hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          isActive ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/5 group-hover/item:bg-primary group-hover/item:text-white"
                        )}>
                          <tool.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black tracking-tight">{tool.label}</p>
                          <p className={cn(
                            "text-[10px] font-medium opacity-60",
                            isActive ? "text-white" : "text-black/40 dark:text-white/40"
                          )}>
                            {tool.prompt.slice(0, 30)}...
                          </p>
                        </div>
                        {isActive && <X className="h-4 w-4" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              ref={inputRef}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Describe your concern..."
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none px-3 md:px-6 py-4 text-base md:text-lg font-medium placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white min-w-0"
              disabled={isLoading}
            />

            <div className="flex items-center gap-2 pr-1 md:pr-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="hidden md:inline-flex h-12 w-12 rounded-full text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button 
                type="submit" 
                disabled={(!localInput.trim() && selectedTools.length === 0) || isLoading}
                className={cn(
                  "h-12 w-12 rounded-full font-black flex items-center justify-center transition-all duration-500 cursor-pointer shadow-none shrink-0",
                  (localInput.trim() || selectedTools.length > 0) ? "bg-primary text-white scale-100 hover:bg-primary/95" : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 scale-95 opacity-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
