"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { 
  ArrowUp,
  Plus,
  Paperclip,
  ShieldCheck,
  Loader2,
  Globe,
  ArrowUpRight,
  Trash2,
  Sparkles,
  Stethoscope,
  Microscope,
  FileSearch,
  Brain,
  Activity,
  History,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Helper: strip <think>...</think> tags from Qwen model output
function stripThinkTags(text: string): string {
  if (!text) return "";
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  // ChatGPT-style tool options
  const toolOptions = [
    { id: "records", icon: FileSearch, label: "Search Records", description: "Search your medical history", prompt: "Search my medical records for " },
    { id: "vitals", icon: Activity, label: "Check Vitals", description: "Latest vitals & lab results", prompt: "What are my latest vitals and lab results?" },
    { id: "doctor", icon: Stethoscope, label: "Doctor Notes", description: "Notes from your doctors", prompt: "Do I have any notes or messages from my doctor?" },
    { id: "research", icon: Microscope, label: "Medical Research", description: "Search medical literature", prompt: "Research the latest findings on " },
    { id: "voice", icon: History, label: "Past Consultations", description: "Previous voice call summaries", prompt: "Summarize my past voice consultations" },
    { id: "intelligence", icon: Brain, label: "Clinical Summary", description: "AI-synthesized health overview", prompt: "Give me a full synthesized clinical intelligence summary" },
  ];

  // Close tool menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolMenuRef.current && !toolMenuRef.current.contains(e.target as Node)) {
        setToolMenuOpen(false);
      }
    };
    if (toolMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toolMenuOpen]);

  // Thinking step animation phases
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const thinkingLabels = [
    "Initializing neural pathways...",
    "Scanning medical intelligence...",
    "Synthesizing clinical data...",
    "Formulating response..."
  ];

  useEffect(() => {
    if (!isLoading) {
      setThinkingPhase(0);
      return;
    }
    const timers = [
      setTimeout(() => setThinkingPhase(1), 800),
      setTimeout(() => setThinkingPhase(2), 2000),
      setTimeout(() => setThinkingPhase(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const suggestions = [
    "Analyze my latest blood work",
    "Compare my vitals to last month",
    "Summarize my recent consultations",
    "Explain my current medications"
  ];

  const handleSend = () => {
    if (!localInput.trim() || isLoading) return;
    sendMessage({ text: localInput.trim() });
    setLocalInput("");
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleClearChat = () => {
    setMessages([
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
    ]);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Extract display text from a message, stripping think tags
  const getDisplayText = (msg: any): string => {
    if (msg.parts && msg.parts.length > 0) {
      const textParts = msg.parts
        .filter((p: any) => p.type === "text" && p.text)
        .map((p: any) => stripThinkTags(
          msg.role === "user" && p.text.includes("### USER QUERY")
            ? p.text.split("### USER QUERY")[1].trim()
            : p.text
        ))
        .filter((t: string) => t.length > 0);
      return textParts.join("\n\n");
    }
    if (msg.content) {
      return stripThinkTags(msg.content);
    }
    return "";
  };

  // Check if this is the last assistant message currently loading
  const isLastAssistantLoading = (idx: number, msg: any) => {
    return isLoading && msg.role === "assistant" && idx === messages.length - 1;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafa] dark:bg-[#050505] overflow-hidden relative">
      {/* ===== HEADER ===== */}
      <div className="px-3.5 md:px-5 py-2 md:py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/60 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl overflow-hidden shadow-md shadow-primary/10 rotate-2 border border-white dark:border-white/10">
              <img 
                src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                alt="Dr. Gita" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#050505] shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bricolage font-black text-xs md:text-sm tracking-tight text-black dark:text-white">Dr. Gita</h3>
              <Badge className="bg-primary/5 text-primary border-primary/10 text-[6px] md:text-[7px] font-black uppercase tracking-widest px-1.5 py-0">Active</Badge>
            </div>
            <p className="text-[7px] md:text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.1em]">Health AI • Encrypted</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[7px] font-black text-black/20 dark:text-white/20 uppercase tracking-widest">Status</span>
            <span className="text-[9px] font-black text-black dark:text-white flex items-center gap-1">
              <Globe className="h-2.5 w-2.5 text-green-500" /> Connected
            </span>
          </div>
          <div className="h-5 w-px bg-black/[0.05] dark:bg-white/[0.05] hidden md:block" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClearChat}
            className="h-7 w-7 md:h-8 md:w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ===== MESSAGES AREA - scrollable, fills space between header and input ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" ref={scrollAreaRef}>
        <div className="flex flex-col gap-3 md:gap-5 max-w-4xl mx-auto w-full px-3 md:px-6 pt-4 pb-4">
          
          {/* Welcome state with suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-col items-center justify-center py-8 md:py-14 text-center">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden mb-4 border border-black/10 dark:border-white/10 rotate-2 transition-transform hover:rotate-0 duration-500 shadow-lg">
                <img 
                  src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                  alt="Dr. Gita" 
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="text-lg md:text-xl font-bricolage font-black text-black dark:text-white mb-1.5 tracking-tight">Start your Consultation</h4>
              <p className="text-[11px] md:text-xs text-black/50 dark:text-white/50 font-semibold max-w-xs mb-5 leading-relaxed">
                I have full access to your medical records. Ask me anything about your health.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg">
                {suggestions.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setLocalInput(text)}
                    className="flex items-center justify-between p-3 md:p-3.5 rounded-xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#0f0f0f] hover:border-primary/40 hover:bg-primary/5 transition-all group text-left cursor-pointer"
                  >
                    <span className="text-[11px] md:text-xs font-bold text-black/55 dark:text-white/55 group-hover:text-black dark:group-hover:text-white leading-normal pr-2">{text}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-black/15 dark:text-white/15 group-hover:text-primary transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((msg, idx) => {
            const displayText = getDisplayText(msg);
            const hasTools = msg.toolInvocations && msg.toolInvocations.length > 0;
            const isAssistantGenerating = isLastAssistantLoading(idx, msg);

            // Skip truly empty assistant messages (no text, no tools, not currently generating)
            if (msg.role === "assistant" && !displayText && !hasTools && !isAssistantGenerating) {
              return null;
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex gap-2 md:gap-3 w-full",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <Avatar className={cn(
                  "h-6 w-6 md:h-7 md:w-7 border shrink-0 rounded-lg mt-0.5",
                  msg.role === "user" ? "border-primary/20" : "border-black/5 dark:border-white/10"
                )}>
                  {msg.role === "assistant" ? (
                    <>
                      <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Gita" className="rounded-lg" />
                      <AvatarFallback className="bg-primary text-white text-[7px] font-black rounded-lg">DG</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={session?.user?.image || ""} alt={userName} className="rounded-lg" />
                      <AvatarFallback className="bg-black text-white text-[7px] font-black rounded-lg">
                        {userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                {/* Bubble */}
                <div className={cn(
                  "max-w-[85%] md:max-w-[75%] relative group",
                  msg.role === "user"
                    ? "bg-[#0047FF] text-white rounded-2xl rounded-tr-md px-3.5 md:px-4.5 py-2.5 md:py-3"
                    : "bg-white dark:bg-[#111] text-black/90 dark:text-white/90 rounded-2xl rounded-tl-md px-3.5 md:px-4.5 py-2.5 md:py-3 border border-black/[0.06] dark:border-white/[0.06] shadow-sm",
                  // Neon glow border when generating
                  isAssistantGenerating && "neon-loading-border"
                )}>
                  
                  {/* Text Content */}
                  {displayText && (
                    <div className={cn(
                      "prose prose-sm max-w-none font-semibold tracking-tight text-[13px] md:text-sm leading-relaxed",
                      msg.role === "user" ? "prose-invert text-white/95" : "text-black/80 dark:text-white/80"
                    )}>
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          h1: ({node, ...props}) => <h3 className="text-base font-black mb-2 mt-3" {...props} />,
                          h2: ({node, ...props}) => <h4 className="text-sm font-black mb-1.5 mt-2" {...props} />,
                          h3: ({node, ...props}) => <h5 className="text-sm font-bold mb-1 mt-2" {...props} />,
                        }}
                      >
                        {displayText}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Tool Invocations */}
                  {hasTools && (
                    <div className={cn("flex flex-col gap-1.5", displayText && "mt-2.5 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04]")}>
                      {msg.toolInvocations.map((call: any, i: number) => (
                        <div
                          key={`tool-${i}`}
                          className="flex items-center gap-2 text-[11px] md:text-xs text-black/45 dark:text-white/45 font-medium"
                        >
                          {call.state === "result" ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60 shrink-0" />
                          )}
                          <span className="truncate">
                            {call.toolName === "searchMedicalHistory" && "Searched medical records"}
                            {call.toolName === "getLatestVitals" && "Retrieved latest vitals"}
                            {call.toolName === "searchMedicalLiterature" && "Searched medical literature"}
                            {call.toolName === "getDoctorNotes" && "Checked doctor's notes"}
                            {call.toolName === "searchVoiceHistory" && "Reviewed consultation history"}
                            {call.toolName === "getDoctorIntelligence" && "Synthesized clinical intelligence"}
                            {!["searchMedicalHistory", "getLatestVitals", "searchMedicalLiterature", "getDoctorNotes", "searchVoiceHistory", "getDoctorIntelligence"].includes(call.toolName) && `Used ${call.toolName}`}
                            {call.state === "result" ? " ✓" : "..."}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ===== PREMIUM NEON LOADING STATE ===== */}
                  {isAssistantGenerating && !displayText && (
                    <div className="flex flex-col gap-3 min-w-[200px] md:min-w-[280px]">
                      {/* Animated wave bars */}
                      <div className="flex items-end gap-[3px] h-8 px-1">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-full"
                            initial={{ height: 4 }}
                            animate={{ 
                              height: [4, 12 + Math.random() * 20, 6, 16 + Math.random() * 16, 4],
                            }}
                            transition={{
                              duration: 1.2 + Math.random() * 0.6,
                              repeat: Infinity,
                              delay: i * 0.08,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>

                      {/* Thinking phase label */}
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary/50 animate-pulse" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={thinkingPhase}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-[10px] md:text-[11px] font-bold text-black/35 dark:text-white/35 tracking-wide"
                          >
                            {thinkingLabels[thinkingPhase]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* ===== LOADING CARD when no assistant message exists yet ===== */}
          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 md:gap-3 w-full"
            >
              <Avatar className="h-6 w-6 md:h-7 md:w-7 border border-black/5 dark:border-white/10 shrink-0 rounded-lg mt-0.5">
                <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Gita" className="rounded-lg" />
                <AvatarFallback className="bg-primary text-white text-[7px] font-black rounded-lg">DG</AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-[#111] rounded-2xl rounded-tl-md px-3.5 md:px-4.5 py-3 md:py-4 border border-black/[0.06] dark:border-white/[0.06] shadow-sm neon-loading-border min-w-[200px] md:min-w-[300px]">
                {/* Wave bars */}
                <div className="flex items-end gap-[3px] h-8 px-1 mb-3">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-full"
                      initial={{ height: 4 }}
                      animate={{ 
                        height: [4, 14 + Math.random() * 18, 6, 18 + Math.random() * 14, 4],
                      }}
                      transition={{
                        duration: 1.2 + Math.random() * 0.6,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary/50 animate-pulse" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={thinkingPhase}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] md:text-[11px] font-bold text-black/35 dark:text-white/35 tracking-wide"
                    >
                      {thinkingLabels[thinkingPhase]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ===== FIXED BOTTOM INPUT BAR ===== */}
      <div className="shrink-0 border-t border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl px-3 md:px-6 py-2.5 md:py-3 z-30">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={onFormSubmit}
            className="relative bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 p-1 md:p-1.5 rounded-xl md:rounded-2xl flex items-center gap-1.5 focus-within:border-primary/40 transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:shadow-primary/5"
          >
            {/* Tool Selector Button (+) */}
            <div className="relative pl-0.5 md:pl-1" ref={toolMenuRef}>
              <button
                type="button"
                onClick={() => setToolMenuOpen(!toolMenuOpen)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0",
                  toolMenuOpen
                    ? "bg-primary/10 text-primary rotate-45"
                    : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/60 dark:hover:text-white/60"
                )}
              >
                {toolMenuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>

              {/* Tool Popover Menu */}
              <AnimatePresence>
                {toolMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full left-0 mb-2 w-[260px] md:w-[280px] bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                      <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.15em]">Tools & Capabilities</p>
                    </div>
                    <div className="py-1 max-h-[280px] overflow-y-auto">
                      {toolOptions.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setLocalInput(tool.prompt);
                            setToolMenuOpen(false);
                            inputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-left group"
                        >
                          <div className="h-7 w-7 rounded-lg bg-primary/8 dark:bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                            <tool.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-black/80 dark:text-white/80 group-hover:text-black dark:group-hover:text-white truncate">{tool.label}</p>
                            <p className="text-[10px] font-medium text-black/35 dark:text-white/35 truncate">{tool.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
                      <p className="text-[8px] font-semibold text-black/25 dark:text-white/25 text-center">Tools are also invoked automatically by AI</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={inputRef}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask Dr. Gita anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none px-1.5 md:px-2.5 py-2 md:py-2.5 text-[13px] md:text-sm font-semibold placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white min-w-0"
              disabled={isLoading}
            />

            <div className="flex items-center gap-1 pr-0.5 md:pr-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="hidden md:inline-flex h-8 w-8 rounded-full text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                disabled={!localInput.trim() || isLoading}
                className={cn(
                  "h-8 w-8 md:h-9 md:w-9 rounded-full font-black flex items-center justify-center transition-all duration-300 cursor-pointer shadow-none shrink-0",
                  localInput.trim() 
                    ? "bg-primary text-white hover:bg-primary/90 scale-100" 
                    : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 scale-95 opacity-40"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          <p className="text-center text-[8px] md:text-[9px] font-semibold text-black/20 dark:text-white/20 mt-1.5 tracking-wide">
            Dr. Gita may produce inaccurate information. Verify important medical advice with your physician.
          </p>
        </div>
      </div>

      {/* ===== NEON LOADING BORDER CSS ===== */}
      <style jsx global>{`
        @keyframes neonBorderRotate {
          0% { --angle: 0deg; }
          100% { --angle: 360deg; }
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .neon-loading-border {
          position: relative;
          overflow: visible;
        }

        .neon-loading-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(
            from var(--angle, 0deg),
            transparent 0%,
            #3b82f6 20%,
            #60a5fa 35%,
            #93c5fd 50%,
            #60a5fa 65%,
            #3b82f6 80%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: neonBorderRotate 2s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .neon-loading-border::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: inherit;
          background: conic-gradient(
            from var(--angle, 0deg),
            transparent 0%,
            rgba(59, 130, 246, 0.15) 25%,
            rgba(96, 165, 250, 0.08) 50%,
            rgba(59, 130, 246, 0.15) 75%,
            transparent 100%
          );
          filter: blur(8px);
          animation: neonBorderRotate 2s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}
