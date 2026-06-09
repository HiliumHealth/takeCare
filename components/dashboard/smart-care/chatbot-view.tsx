"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Strip <think>...</think> tags from Qwen output
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

// Tool options for the + menu
const TOOL_OPTIONS = [
  { id: "records", icon: FileSearch, label: "Search Records", desc: "Search your medical history", prompt: "Search my medical records for " },
  { id: "vitals", icon: Activity, label: "Check Vitals", desc: "Latest vitals & lab results", prompt: "What are my latest vitals and lab results?" },
  { id: "doctor", icon: Stethoscope, label: "Doctor Notes", desc: "Notes from your doctors", prompt: "Do I have any notes or messages from my doctor?" },
  { id: "research", icon: Microscope, label: "Medical Research", desc: "Search medical literature", prompt: "Research the latest findings on " },
  { id: "voice", icon: History, label: "Past Consultations", desc: "Previous voice call summaries", prompt: "Summarize my past voice consultations" },
  { id: "intelligence", icon: Brain, label: "Clinical Summary", desc: "AI-synthesized health overview", prompt: "Give me a full synthesized clinical intelligence summary" },
];

const SUGGESTIONS = [
  "Analyze my latest blood work",
  "Compare my vitals to last month",
  "Summarize my recent consultations",
  "Explain my current medications",
];

export function ChatbotView({
  userName,
  messages,
  sendMessage,
  status,
  setMessages,
}: ChatbotViewProps) {
  const { data: session } = useSession();
  const isLoading = status === "submitting" || status === "submitted" || status === "streaming";

  const [localInput, setLocalInput] = useState("");
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  // ── Thinking animation ──
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const thinkingLabels = [
    "Initializing neural pathways…",
    "Scanning medical intelligence…",
    "Synthesizing clinical data…",
    "Formulating response…",
  ];

  useEffect(() => {
    if (!isLoading) { setThinkingPhase(0); return; }
    const t = [
      setTimeout(() => setThinkingPhase(1), 800),
      setTimeout(() => setThinkingPhase(2), 2000),
      setTimeout(() => setThinkingPhase(3), 3500),
    ];
    return () => t.forEach(clearTimeout);
  }, [isLoading]);

  // ── Direct send helper (bypasses localInput state) ──
  const directSend = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sendMessage({ text: text.trim() });
    },
    [sendMessage, isLoading],
  );

  // ── Form-based send ──
  const handleFormSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!localInput.trim() || isLoading) return;
      sendMessage({ text: localInput.trim() });
      setLocalInput("");
    },
    [localInput, isLoading, sendMessage],
  );

  // ── Clear chat ──
  const handleClear = useCallback(() => {
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
  }, [setMessages, userName]);

  // ── Auto-scroll ──
  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Close tool menu on outside click ──
  useEffect(() => {
    if (!toolMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (toolMenuRef.current && !toolMenuRef.current.contains(e.target as Node)) {
        setToolMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolMenuOpen]);

  // ── Display text helper ──
  const getDisplayText = (msg: any): string => {
    if (msg.parts?.length) {
      return msg.parts
        .filter((p: any) => p.type === "text" && p.text)
        .map((p: any) =>
          stripThinkTags(
            msg.role === "user" && p.text.includes("### USER QUERY")
              ? p.text.split("### USER QUERY")[1].trim()
              : p.text,
          ),
        )
        .filter(Boolean)
        .join("\n\n");
    }
    return msg.content ? stripThinkTags(msg.content) : "";
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[#fafafa] dark:bg-[#050505] overflow-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="shrink-0 px-3 md:px-5 py-2 md:py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/60 dark:bg-black/60 backdrop-blur-2xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl overflow-hidden shadow-md shadow-primary/10 rotate-2 border border-white dark:border-white/10">
              <img src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" alt="Dr. Gita" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#050505]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bricolage font-black text-xs md:text-sm tracking-tight text-black dark:text-white">Dr. Gita</h3>
              <Badge className="bg-primary/5 text-primary border-primary/10 text-[6px] md:text-[7px] font-black uppercase tracking-widest px-1.5 py-0">Active</Badge>
            </div>
            <p className="text-[7px] md:text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.1em]">Health AI • Encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden md:flex items-center gap-1 text-[9px] font-black text-black/50 dark:text-white/50"><Globe className="h-2.5 w-2.5 text-green-500" /> Connected</span>
          <Button variant="ghost" size="icon" onClick={handleClear} title="Clear" className="h-7 w-7 md:h-8 md:w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ═══════ SCROLLABLE MESSAGES ═══════ */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth chat-bg-pattern">
        <div className="max-w-4xl mx-auto w-full px-3 md:px-6 pt-4 pb-6 flex flex-col gap-4 md:gap-5 relative z-10">

          {/* ── Welcome / Suggestions ── */}
          {messages.length <= 1 && (
            <div className="flex flex-col items-center justify-center py-6 md:py-12 text-center">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden mb-4 border border-black/10 dark:border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500 shadow-lg">
                <img src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" alt="Dr. Gita" className="h-full w-full object-cover" />
              </div>
              <h4 className="text-lg md:text-xl font-bricolage font-black text-black dark:text-white mb-1.5 tracking-tight">Start your Consultation</h4>
              <p className="text-[11px] md:text-xs text-black/50 dark:text-white/50 font-semibold max-w-xs mb-5 leading-relaxed">
                I have full access to your medical records. Ask me anything about your health.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg">
                {SUGGESTIONS.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => directSend(text)}
                    className="flex items-center justify-between p-3 md:p-3.5 rounded-xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#0f0f0f] hover:border-primary/40 hover:bg-primary/5 transition-all group text-left cursor-pointer active:scale-[0.98]"
                  >
                    <span className="text-[11px] md:text-xs font-bold text-black/55 dark:text-white/55 group-hover:text-black dark:group-hover:text-white leading-normal pr-2">{text}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-black/15 dark:text-white/15 group-hover:text-primary transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Message Bubbles ── */}
          {messages.map((msg, idx) => {
            const displayText = getDisplayText(msg);
            const hasTools = msg.toolInvocations?.length > 0;
            const isLastAssistant = isLoading && msg.role === "assistant" && idx === messages.length - 1;
            if (msg.role === "assistant" && !displayText && !hasTools && !isLastAssistant) return null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("flex gap-2.5 md:gap-3 w-full", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar */}
                <Avatar className={cn("h-6 w-6 md:h-7 md:w-7 shrink-0 rounded-lg mt-0.5 border", msg.role === "user" ? "border-primary/20" : "border-black/5 dark:border-white/10")}>
                  {msg.role === "assistant" ? (
                    <>
                      <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Gita" className="rounded-lg" />
                      <AvatarFallback className="bg-primary text-white text-[7px] font-black rounded-lg">DG</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={session?.user?.image || ""} alt={userName} className="rounded-lg" />
                      <AvatarFallback className="bg-black text-white text-[7px] font-black rounded-lg">{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </>
                  )}
                </Avatar>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] relative",
                    msg.role === "user"
                      ? "bg-[#0047FF] text-white rounded-2xl rounded-tr-md px-3.5 md:px-4.5 py-2.5 md:py-3"
                      : "bg-white dark:bg-[#111] text-black/90 dark:text-white/90 rounded-2xl rounded-tl-md px-3.5 md:px-4.5 py-2.5 md:py-3 border border-black/[0.06] dark:border-white/[0.06] shadow-sm",
                    isLastAssistant && "neon-glow-border",
                  )}
                >
                  {/* Text */}
                  {displayText && (
                    <div className={cn("prose prose-sm max-w-none font-semibold tracking-tight text-[13px] md:text-sm leading-relaxed", msg.role === "user" ? "prose-invert text-white/95" : "text-black/80 dark:text-white/80")}>
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-black" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          h1: ({ node, ...props }) => <h3 className="text-base font-black mb-2 mt-3" {...props} />,
                          h2: ({ node, ...props }) => <h4 className="text-sm font-black mb-1.5 mt-2" {...props} />,
                          h3: ({ node, ...props }) => <h5 className="text-sm font-bold mb-1 mt-2" {...props} />,
                        }}
                      >
                        {displayText}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Tool invocations */}
                  {hasTools && (
                    <div className={cn("flex flex-col gap-1.5", displayText && "mt-2.5 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04]")}>
                      {msg.toolInvocations.map((call: any, i: number) => (
                        <div key={`t-${i}`} className="flex items-center gap-2 text-[11px] md:text-xs text-black/45 dark:text-white/45 font-medium">
                          {call.state === "result" ? <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/60 shrink-0" />}
                          <span className="truncate">
                            {{ searchMedicalHistory: "Searched medical records", getLatestVitals: "Retrieved latest vitals", searchMedicalLiterature: "Searched medical literature", getDoctorNotes: "Checked doctor's notes", searchVoiceHistory: "Reviewed consultation history", getDoctorIntelligence: "Synthesized clinical intelligence" }[call.toolName as string] || `Used ${call.toolName}`}
                            {call.state === "result" ? " ✓" : "…"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Loading waves */}
                  {isLastAssistant && !displayText && <LoadingWaves phase={thinkingPhase} labels={thinkingLabels} />}
                </div>
              </motion.div>
            );
          })}

          {/* Standalone loading card when last msg is user's */}
          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 md:gap-3 w-full">
              <Avatar className="h-6 w-6 md:h-7 md:w-7 shrink-0 rounded-lg mt-0.5 border border-black/5 dark:border-white/10">
                <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Gita" className="rounded-lg" />
                <AvatarFallback className="bg-primary text-white text-[7px] font-black rounded-lg">DG</AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-[#111] rounded-2xl rounded-tl-md px-4 md:px-5 py-3 md:py-4 border border-black/[0.06] dark:border-white/[0.06] shadow-sm neon-glow-border min-w-[220px] md:min-w-[320px]">
                <LoadingWaves phase={thinkingPhase} labels={thinkingLabels} />
              </div>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomAnchorRef} className="h-1 shrink-0" />
        </div>
      </div>

      {/* ═══════ FIXED INPUT BAR ═══════ */}
      <div className="shrink-0 border-t border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl px-3 md:px-6 py-2 md:py-2.5 z-30">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleFormSend}
            className="relative bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 p-1 md:p-1.5 rounded-xl md:rounded-2xl flex items-center gap-1 focus-within:border-primary/40 transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:shadow-primary/5"
          >
            {/* + Tool Menu */}
            <div className="relative pl-0.5" ref={toolMenuRef}>
              <button
                type="button"
                onClick={() => setToolMenuOpen((v) => !v)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0",
                  toolMenuOpen ? "bg-primary/10 text-primary" : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10",
                )}
              >
                <Plus className={cn("h-4 w-4 transition-transform duration-300", toolMenuOpen && "rotate-45")} />
              </button>

              <AnimatePresence>
                {toolMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-[256px] md:w-[280px] bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                      <p className="text-[9px] font-black text-black/30 dark:text-white/30 uppercase tracking-[0.15em]">Tools & Capabilities</p>
                    </div>
                    <div className="py-1">
                      {TOOL_OPTIONS.map((tool) => {
                        const endsOpen = tool.prompt.endsWith(" ");
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                              setToolMenuOpen(false);
                              if (endsOpen) {
                                // Prompt needs user input: fill input and focus
                                setLocalInput(tool.prompt);
                                setTimeout(() => inputRef.current?.focus(), 50);
                              } else {
                                // Complete prompt: send immediately
                                directSend(tool.prompt);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-left group"
                          >
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                              <tool.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-black/80 dark:text-white/80 truncate">{tool.label}</p>
                              <p className="text-[10px] font-medium text-black/35 dark:text-white/35 truncate">{tool.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                      <p className="text-[8px] font-semibold text-black/25 dark:text-white/25 text-center">Tools are also auto-invoked by AI</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={inputRef}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask Dr. Gita anything…"
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none px-1.5 md:px-2.5 py-2 md:py-2.5 text-[13px] md:text-sm font-semibold placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white min-w-0"
              disabled={isLoading}
            />

            <div className="flex items-center gap-1 pr-0.5 md:pr-1">
              <Button type="button" variant="ghost" size="icon" className="hidden md:inline-flex h-8 w-8 rounded-full text-black/20 dark:text-white/20 hover:text-black/40 hover:bg-black/5 transition-all cursor-pointer">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!localInput.trim() || isLoading}
                className={cn(
                  "h-8 w-8 md:h-9 md:w-9 rounded-full font-black flex items-center justify-center transition-all duration-300 cursor-pointer shadow-none shrink-0",
                  localInput.trim() ? "bg-primary text-white hover:bg-primary/90 scale-100" : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 scale-95 opacity-40",
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          <p className="text-center text-[8px] md:text-[9px] font-semibold text-black/20 dark:text-white/20 mt-1.5">
            Dr. Gita may produce inaccurate info. Verify with your physician.
          </p>
        </div>
      </div>

      {/* ═══════ NEON CSS + CHAT BG ═══════ */}
      <style jsx global>{`
        /* WhatsApp-style chat background */
        .chat-bg-pattern {
          background-color: #edf6fc;
          background-image:
            radial-gradient(circle, rgba(59,130,246,0.07) 1px, transparent 1px),
            radial-gradient(circle, rgba(99,102,241,0.05) 1px, transparent 1px);
          background-size: 24px 24px, 36px 36px;
          background-position: 0 0, 12px 12px;
        }
        :is(.dark) .chat-bg-pattern {
          background-color: #060a10;
          background-image:
            radial-gradient(circle, rgba(59,130,246,0.08) 1px, transparent 1px),
            radial-gradient(circle, rgba(99,102,241,0.05) 1px, transparent 1px);
          background-size: 24px 24px, 36px 36px;
          background-position: 0 0, 12px 12px;
        }

        @property --glow-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes glowSpin {
          to { --glow-angle: 360deg; }
        }
        .neon-glow-border {
          position: relative;
          overflow: visible;
        }
        .neon-glow-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(from var(--glow-angle,0deg), transparent 0%, #3b82f6 20%, #818cf8 40%, #60a5fa 60%, #3b82f6 80%, transparent 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: glowSpin 2s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        .neon-glow-border::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: inherit;
          background: conic-gradient(from var(--glow-angle,0deg), transparent 0%, rgba(59,130,246,0.12) 25%, rgba(129,140,248,0.06) 50%, rgba(59,130,246,0.12) 75%, transparent 100%);
          filter: blur(10px);
          animation: glowSpin 2s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}

/* ═══════ Artistic Loading Waves Component ═══════ */
function LoadingWaves({ phase, labels }: { phase: number; labels: string[] }) {
  return (
    <div className="flex flex-col gap-3 min-w-[200px] md:min-w-[280px]">
      {/* DNA helix / sound-wave bars */}
      <div className="flex items-center justify-center gap-[2.5px] h-10 px-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to top, hsl(${220 + i * 4}, 85%, 60%), hsl(${240 + i * 3}, 90%, 75%))`,
            }}
            animate={{
              height: [3, 8 + Math.sin(i * 0.5) * 14, 4, 10 + Math.cos(i * 0.7) * 18, 3],
              opacity: [0.5, 1, 0.6, 1, 0.5],
            }}
            transition={{
              duration: 1.6 + (i % 3) * 0.2,
              repeat: Infinity,
              delay: i * 0.06,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Shimmer skeleton lines */}
      <div className="flex flex-col gap-1.5 px-1">
        <div className="h-2 w-[90%] rounded-full bg-gradient-to-r from-black/[0.03] via-black/[0.08] to-black/[0.03] dark:from-white/[0.03] dark:via-white/[0.08] dark:to-white/[0.03] animate-pulse" />
        <div className="h-2 w-[70%] rounded-full bg-gradient-to-r from-black/[0.03] via-black/[0.08] to-black/[0.03] dark:from-white/[0.03] dark:via-white/[0.08] dark:to-white/[0.03] animate-pulse [animation-delay:150ms]" />
        <div className="h-2 w-[50%] rounded-full bg-gradient-to-r from-black/[0.03] via-black/[0.08] to-black/[0.03] dark:from-white/[0.03] dark:via-white/[0.08] dark:to-white/[0.03] animate-pulse [animation-delay:300ms]" />
      </div>

      {/* Phase label */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3 w-3 text-primary/50 animate-pulse" />
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[10px] md:text-[11px] font-bold text-black/30 dark:text-white/30 tracking-wide"
          >
            {labels[phase]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
