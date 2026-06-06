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
    const userQuery = localInput.trim() === "" && selectedTools.length > 0 
      ? "Please analyze my medical context using the tools provided." 
      : localInput.trim();
      
    const messageToSend = `
${selectedTools.length > 0 ? "### SYSTEM INSTRUCTIONS\n" + instructions + "\n\n" : ""}
### USER QUERY
${userQuery}
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
      className="flex flex-col flex-1 w-full h-full bg-[#fcfcfc] dark:bg-[#0a0a0a] overflow-hidden relative shadow-none antialiased"
    >
      {/* Dynamic Chat Header */}
      <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-black/[0.03] dark:border-white/[0.03] bg-white/40 dark:bg-black/40 backdrop-blur-3xl flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-8.5 w-8.5 rounded-lg overflow-hidden shadow-md shadow-primary/10 rotate-3 border border-white">
              <img 
                src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                alt="Dr. Gita" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bricolage font-black text-xs md:text-sm tracking-tight text-black dark:text-white">Dr. Gita</h3>
              <Badge className="bg-primary/5 text-primary border-primary/10 text-[7px] font-black uppercase tracking-widest px-1.2 py-0">Active Intelligence</Badge>
            </div>
            <p className="text-[8px] font-black text-black/45 dark:text-white/45 uppercase tracking-[0.1em]">Verified Health Assistant • Encryption Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[7px] font-black text-black/25 dark:text-white/25 uppercase tracking-widest">Connection Status</span>
            <span className="text-[9px] font-black text-black dark:text-white flex items-center gap-1">
              <Globe className="h-2.5 w-2.5 text-green-500" /> Ultra-Low Latency
            </span>
          </div>
          <div className="h-6 w-px bg-black/[0.05] dark:bg-white/[0.05]" />
          <Button variant="ghost" size="icon" className="h-7.5 w-7.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <History className="h-3.5 w-3.5 text-black/40 dark:text-white/40" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area - Flex-1 ensures it takes all available space above the dock */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full px-0.5 md:px-6" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 md:gap-6 max-w-5xl mx-auto w-full pt-4 pb-36 md:pb-6">
            {messages.length <= 1 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-2xl overflow-hidden mb-5 border border-black/10 dark:border-white/10 rotate-2 transition-transform hover:rotate-0 duration-500 shadow-md">
                  <img 
                    src="https://i.ibb.co/fYy0cwxb/Chat-GPT-Image-Apr-16-2026-09-01-03-AM.png" 
                    alt="Dr. Gita" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <h4 className="text-xl font-bricolage font-black text-black dark:text-white mb-2 tracking-tight">Start your Consultation</h4>
                <p className="text-xs text-black/60 dark:text-white/60 font-semibold max-w-xs mb-6 leading-relaxed">
                  I have full access to your medical records. Ask me anything about your health history, vitals, or symptoms.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-xl">
                  {suggestions.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => setLocalInput(text)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f0f0f] hover:border-primary/40 hover:bg-primary/5 transition-all group text-left shadow-none cursor-pointer"
                    >
                      <span className="text-xs font-bold text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white leading-normal pr-3">{text}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-black/20 dark:text-white/20 group-hover:text-primary transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              // Avoid rendering empty assistant messages (e.g. while tool is executing but before stream has text/parts/tools)
              const hasParts = msg.parts && msg.parts.length > 0;
              const hasContent = msg.content && msg.content.trim().length > 0;
              const hasTools = msg.toolInvocations && msg.toolInvocations.length > 0;
              if (msg.role === "assistant" && !hasContent && !hasParts && !hasTools) {
                return null;
              }
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className={cn(
                    "flex flex-col md:flex-row md:items-end gap-1.5 md:gap-2.5 mb-5 md:mb-6 w-full",
                    msg.role === "user" ? "items-end md:flex-row-reverse" : "items-start md:flex-row"
                  )}
                >
                  {/* Avatar Wrapper - Small and above the bubble on mobile */}
                  <div className="flex items-center gap-2 mb-0.5 md:mb-0 md:contents">
                    <Avatar className={cn(
                      "h-5 w-5 md:h-8 md:w-8 border border-black/5 shadow-sm shrink-0 rounded-lg",
                      msg.role === "user" ? "border-primary/20" : "border-white dark:border-white/10"
                    )}>
                      {msg.role === "assistant" ? (
                        <>
                          <AvatarImage src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" alt="Dr. Gita" className="rounded-lg" />
                          <AvatarFallback className="bg-primary text-white text-[8px] font-black rounded-lg">GITA</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={session?.user?.image || ""} alt={userName} className="rounded-lg" />
                          <AvatarFallback className="bg-black text-white text-[8px] font-black rounded-lg">
                            {userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <span className="md:hidden text-[8px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
                      {msg.role === "user" ? "You" : "Dr. Gita"}
                    </span>
                  </div>

                  {(() => {
                    const isGenerating = isLoading && msg.role === "assistant" && idx === messages.length - 1;
                    return (
                      <div
                        className={cn(
                          "w-fit md:max-w-[80%] relative group shadow-sm",
                          msg.role === "user"
                            ? "bg-[#0047FF] text-white rounded-2xl rounded-tr-[4px] px-4 md:px-5 py-2.5 md:py-3.5"
                            : "bg-white dark:bg-[#1a1a1a] text-black/90 dark:text-white/90 rounded-2xl rounded-tl-[4px] px-4 md:px-5 py-2.5 md:py-3.5 border border-black/5 dark:border-white/5"
                        )}
                      >
                        <div className="flex flex-col gap-2 relative z-10 w-full h-full">
                      {/* Render text content */}
                      {msg.parts && msg.parts.length > 0 ? (
                        msg.parts.map((part: any, i: number) => {
                          if (part.type === "text" && part.text) {
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "prose prose-xs md:prose-sm max-w-none font-bold tracking-tight text-xs md:text-sm leading-relaxed",
                                  msg.role === "user" ? "prose-invert text-white/95" : "text-black/80 dark:text-white/80"
                                )}
                              >
                                <ReactMarkdown
                                  components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                  }}
                                >
                                  {msg.role === "user" && part.text.includes("### USER QUERY") 
                                    ? part.text.split("### USER QUERY")[1].trim() 
                                    : part.text}
                                </ReactMarkdown>
                              </div>
                            );
                          }
                          return null;
                        })
                      ) : msg.content ? (
                        <div
                          className={cn(
                            "prose prose-xs md:prose-sm max-w-none font-bold tracking-tight text-xs md:text-sm leading-relaxed",
                            msg.role === "user" ? "prose-invert text-white/95" : "text-black/80 dark:text-white/80"
                          )}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : null}

                      {/* Render Tool Invocations globally (ChatGPT Style) */}
                      {msg.toolInvocations && msg.toolInvocations.map((call: any, i: number) => (
                        <div
                          key={`tool-${i}`}
                          className="flex items-center gap-2.5 text-[13px] text-black/50 dark:text-white/50 mb-1 last:mb-0 font-medium"
                        >
                          {call.state === "result" ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin text-black/40 dark:text-white/40" />
                          )}
                          <span>
                            {call.toolName === "searchMedicalHistory" && "Searching your medical records..."}
                            {call.toolName === "getLatestVitals" && "Checking latest vitals..."}
                            {call.toolName === "searchMedicalLiterature" && "Researching medical literature..."}
                            {call.toolName === "getDoctorNotes" && "Reading doctor's notes..."}
                            {call.toolName === "searchVoiceHistory" && "Analyzing consultation history..."}
                            {call.toolName === "getDoctorIntelligence" && "Synthesizing clinical intelligence..."}
                            {!["searchMedicalHistory", "getLatestVitals", "searchMedicalLiterature", "getDoctorNotes", "searchVoiceHistory", "getDoctorIntelligence"].includes(call.toolName) && `Using ${call.toolName}...`}
                          </span>
                        </div>
                      ))}

                      {/* Clean Loading Indicator when waiting for text */}
                      {!msg.content && (!msg.toolInvocations || msg.toolInvocations.length === 0) && isGenerating && (
                        <div className="flex items-center gap-1.5 h-6 px-1">
                          <span className="w-1.5 h-1.5 bg-black/30 dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-black/30 dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-black/30 dark:bg-white/30 rounded-full animate-bounce"></span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
                  
                  <div className={cn(
                    "flex items-center gap-2 px-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span className="text-[8px] font-black text-black/15 dark:text-white/15 uppercase tracking-[0.2em] transition-opacity group-hover:opacity-100 opacity-0">
                      {msg.role === "user" ? "Sent by You" : "Origin: Dr. Gita"}
                    </span>
                    <div className="h-0.5 w-0.5 rounded-full bg-black/5 dark:bg-white/5" />
                    <span className="text-[8px] font-black text-black/15 dark:text-white/15 uppercase tracking-[0.2em]">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              )})}
            
            {/* The old Insight Engine loading UI has been removed as per user request to use the neon blue border instead. */}
          </div>
        </ScrollArea>
        {/* Subtle Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      </div>

      {/* Persistent Smart Input Dock - Fixed on mobile, sticky at bottom on desktop */}
      <div className="fixed bottom-[90px] left-2 right-2 z-40 md:relative md:bottom-auto md:left-auto md:right-auto px-2 md:px-6 pb-3 md:pb-4.5 pt-3 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl md:border-t md:border-black/[0.03] md:dark:border-white/[0.03] shadow-none">
        
        {/* Selected Tool Indicator - Floats above the input dock */}
        <div className="absolute -top-10 left-6 right-6 flex justify-center z-30 pointer-events-none">
          <div className="flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto">
            <AnimatePresence>
              {selectedTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-full border border-white/20 whitespace-nowrap shadow-sm"
                >
                  <tool.icon className="h-3.5 w-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{tool.label}</span>
                  <button 
                    onClick={() => setSelectedTools(prev => prev.filter(t => t.id !== tool.id))}
                    className="ml-0.5 h-3.5 w-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative group max-w-5xl mx-auto">
          
          <form 
            onSubmit={onFormSubmit}
            className="relative bg-white/85 dark:bg-[#0f0f0f]/85 backdrop-blur-3xl border border-black/10 dark:border-white/10 p-1.5 rounded-2xl flex items-center gap-2 group-focus-within:border-primary/40 transition-all duration-500 shadow-none"
          >
            <DropdownMenu open={isToolMenuOpen} onOpenChange={setIsToolMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="h-10.5 w-10.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <Plus className={cn("h-4.5 w-4.5 text-black/40 dark:text-white/40 transition-transform duration-500", isToolMenuOpen && "rotate-45 text-primary")} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-64 p-2 rounded-2xl border-black/5 dark:border-white/5 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl mb-3"
              >
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Diagnostic Tools</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5" />
                <div className="grid gap-1.5 p-1">
                  {tools.map((tool) => {
                    const isActive = selectedTools.find(t => t.id === tool.id);
                    return (
                      <DropdownMenuItem 
                        key={tool.id} 
                        onClick={() => handleToolSelect(tool)}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors group/item",
                          isActive ? "bg-primary text-white" : "hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "h-8.5 w-8.5 rounded-lg flex items-center justify-center transition-all shrink-0",
                          isActive ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/5 group-hover/item:bg-primary group-hover/item:text-white"
                        )}>
                          <tool.icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black tracking-tight">{tool.label}</p>
                          <p className={cn(
                            "text-[9px] font-medium opacity-60 truncate",
                            isActive ? "text-white" : "text-black/40 dark:text-white/40"
                          )}>
                            {tool.prompt.slice(0, 24)}...
                          </p>
                        </div>
                        {isActive && <X className="h-3.5 w-3.5 shrink-0" />}
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
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none px-2.5 md:px-4 py-2.5 text-xs md:text-sm font-semibold placeholder:text-black/25 dark:placeholder:text-white/25 text-black dark:text-white min-w-0"
              disabled={isLoading}
            />

            <div className="flex items-center gap-1.5 pr-1 md:pr-1.5">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="hidden md:inline-flex h-9.5 w-9.5 rounded-full text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </Button>
              <Button 
                type="submit" 
                disabled={(!localInput.trim() && selectedTools.length === 0) || isLoading}
                className={cn(
                  "h-9.5 w-9.5 rounded-full font-black flex items-center justify-center transition-all duration-500 cursor-pointer shadow-none shrink-0",
                  (localInput.trim() || selectedTools.length > 0) ? "bg-primary text-white scale-100 hover:bg-primary/95" : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 scale-95 opacity-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-4.5 w-4.5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
