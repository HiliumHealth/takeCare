"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Shield,
  Brain,
  Activity,
  X,
  Download,
  Share2,
  Plus,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface RecordDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export function RecordDetailsModal({
  isOpen,
  onClose,
  record
}: RecordDetailsPanelProps) {

  const [smartSummary, setSmartSummary] = React.useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = React.useState(false);

  // Disable body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      // Auto-generate AI summary if not already present
      if (record && !smartSummary) {
        const generateSummary = async () => {
          setIsSummarizing(true);
          try {
            const { generateSmartSummary } = await import("@/app/actions/ai");
            const summary = await generateSmartSummary(record.id);
            setSmartSummary(summary);
          } catch (error) {
            console.error("AI Summary Error:", error);
          } finally {
            setIsSummarizing(false);
          }
        };
        generateSummary();
      }
    } else {
      document.body.style.overflow = "unset";
      setSmartSummary(null); // Reset when closed
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, record?.id]);

  if (!record) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[8px] z-[100] cursor-pointer"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] md:w-[650px] bg-background dark:bg-[#0A0A0A] z-[101] flex flex-col border-l border-black/5 dark:border-white/5"
          >
            {/* High-End Header */}
            <div className="relative px-6 py-8 md:px-10 md:py-10 bg-background dark:bg-[#0A0A0A] border-b border-black/[0.03] dark:border-white/[0.03] shrink-0">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <Badge className="w-fit rounded-full bg-primary/10 text-primary border-none font-black text-[9px] px-3 py-0.5 uppercase tracking-widest mb-1">
                      {record.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[#10B981] font-black text-[9px] uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Case
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hidden md:flex cursor-pointer">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={onClose}
                    className="h-12 w-12 rounded-full bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white flex items-center justify-center p-0 cursor-pointer"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-bricolage text-2xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {record.fileName}
                </h2>

                <div className="flex flex-wrap items-center gap-6 text-neutral-800 dark:text-neutral-200 font-extrabold text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Created {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Shield className="h-4 w-4" />
                    <span>Encrypted Record</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#10B981]">
                    <Lock className="h-3 w-3" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Private Access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area - Scrollable Engine */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background dark:bg-[#0A0A0A]">
              <div className="px-6 py-8 md:px-10 md:py-10 space-y-8">

                {/* Clinical Data Section - Priority for Doctor Notes */}
                {(record.type === "CLINICAL_NOTE" || record.extractedText) && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative overflow-hidden bg-white/50 dark:bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-black/[0.03] dark:border-white/[0.03]"
                  >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <ClipboardList className="h-24 w-24" />
                    </div>

                    <div className="flex flex-col gap-8 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Clinical Observation</span>
                          <span className="text-[9px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">Medical Assessment Data</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bricolage text-2xl font-black text-foreground tracking-tight">Doctor's Assessment</h3>
                          <Badge className="rounded-full bg-[#10B981]/10 text-[#10B981] border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
                            Official Report
                          </Badge>
                        </div>

                        {record.type === "CLINICAL_CONSULTATION" || (record.extractedText && record.extractedText.includes("DIAGNOSIS:")) ? (
                          <div className="space-y-8">
                            {/* Structured Clinical Sections */}
                            {(() => {
                              const text = record.extractedText || "";
                              const sections: any = {};

                              const patterns = {
                                diagnosis: /DIAGNOSIS:\s*([\s\S]*?)(?=CONSULTATION NOTES:|$)/,
                                notes: /CONSULTATION NOTES:\s*([\s\S]*?)(?=PRESCRIPTIONS:|$)/,
                                prescriptions: /PRESCRIPTIONS:\s*([\s\S]*?)(?=LABORATORY INVESTIGATIONS:|$)/,
                                labs: /LABORATORY INVESTIGATIONS:\s*([\s\S]*?)(?=CLINICAL VITAL TARGETS:|$)/,
                                vitals: /CLINICAL VITAL TARGETS:\s*([\s\S]*?)(?=LIFESTYLE ADVICE:|$)/,
                                lifestyle: /LIFESTYLE ADVICE:\s*([\s\S]*?)(?=FOLLOW-UP:|$)/,
                                followUp: /FOLLOW-UP:\s*([\s\S]*)/
                              };

                              Object.entries(patterns).forEach(([key, regex]) => {
                                const match = text.match(regex);
                                if (match && match[1]) sections[key] = match[1].trim();
                              });

                              return (
                                <div className="flex flex-col gap-8">
                                  {/* Top Primary Section: Diagnosis */}
                                  {sections.diagnosis && (
                                    <div className="relative p-8 bg-black/[0.02] dark:bg-white/[0.03] rounded-[2.5rem] border border-black/5 dark:border-white/5 overflow-hidden group">
                                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        <Brain className="h-20 w-20" />
                                      </div>
                                      <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-2">
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                          <span className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Primary Diagnosis</span>
                                        </div>
                                        <h4 className="font-bricolage text-3xl font-black text-foreground leading-tight tracking-tight">
                                          {sections.diagnosis}
                                        </h4>
                                        {sections.notes && (
                                          <p className="text-sm md:text-base font-bold text-neutral-950 dark:text-neutral-50 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-2xl">
                                            {sections.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Secondary Grid: Medications & Labs */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Medications Column */}
                                    {sections.prescriptions && sections.prescriptions !== "None" && (
                                      <div className="p-6 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] rounded-3xl border border-emerald-500/10 flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                              <Plus className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-500">Therapeutics</span>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          {sections.prescriptions.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-emerald-500/5">
                                              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                              </div>
                                              <span className="text-xs font-bold text-foreground leading-snug">{line.replace(/^- /, "")}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Labs Column */}
                                    {sections.labs && !sections.labs.includes("None") && (
                                      <div className="p-6 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] rounded-3xl border border-amber-500/10 flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                              <Activity className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <span className="font-black text-[10px] uppercase tracking-widest text-amber-500">Investigations</span>
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          {sections.labs.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-amber-500/5">
                                              <div className="h-5 w-5 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="h-3 w-3 text-amber-500" />
                                              </div>
                                              <span className="text-xs font-bold text-foreground leading-snug">{line.replace(/^- /, "")}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Lifestyle & Guidance */}
                                  {sections.lifestyle && (
                                    <div className="p-8 bg-sky-500/[0.03] dark:bg-sky-500/[0.05] rounded-[2rem] border border-sky-500/10">
                                      <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                                          <Shield className="h-5 w-5 text-sky-500" />
                                        </div>
                                        <div>
                                          <span className="font-black text-[10px] uppercase tracking-[0.2em] text-sky-500 block">Guidance</span>
                                          <h5 className="font-bold text-lg text-foreground tracking-tight">Lifestyle Recommendations</h5>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {sections.lifestyle.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                                          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-sky-500/5 shadow-none group hover:bg-white transition-all">
                                            <div className="h-2 w-2 rounded-full bg-sky-500/30 group-hover:bg-sky-500 transition-colors" />
                                            <span className="text-xs font-black uppercase tracking-widest text-neutral-950 dark:text-neutral-50">{line.replace(/^- /, "")}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Follow-up / Summary Footer */}
                                  <div className="flex items-center justify-between p-6 bg-black dark:bg-white rounded-3xl">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-white dark:text-black" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">Clinical Follow-up</p>
                                        <p className="text-sm font-bold text-white dark:text-black">{sections.followUp || "As per clinical schedule"}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-white/10 dark:bg-black/10 text-white dark:text-black border-none text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2">
                                      Scheduled
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="p-6 md:p-8 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.03] dark:border-white/[0.03] relative prose dark:prose-invert max-w-none">
                            {(() => {
                              let textToRender = record.analysis?.summary || record.extractedText || "No clinical text available for this record.";
                              // Strip raw JSON wrapping for backward compatibility with old records
                              if (textToRender.includes('"analysis":')) {
                                const match = textToRender.match(/"analysis"\s*:\s*"([\s\S]*?)",?\s*"structuredData"/);
                                if (match && match[1]) {
                                  textToRender = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                                } else {
                                  textToRender = textToRender.replace(/```json\n?/, "").replace(/\n?```/, "").replace(/\{\s*"analysis"\s*:\s*"/, "").replace(/"\s*,\s*"structuredData"[\s\S]*\}\s*$/, "").replace(/\\n/g, "\n").trim();
                                }
                              }

                              return (
                                <ReactMarkdown className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-serif prose dark:prose-invert max-w-none prose-headings:font-bricolage prose-headings:font-black">
                                  {textToRender}
                                </ReactMarkdown>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI Intelligence Hero */}
                {record.type !== "CLINICAL_NOTE" && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden bg-white/50 dark:bg-white/5 rounded-[2.5rem] p-8 border border-black/[0.03] dark:border-white/[0.03] group"
                  >
                    {/* Branded Logo Watermark */}
                    <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                      <img src="/hilium.png" alt="" className="h-40 w-40 object-contain grayscale" />
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-primary">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Brain className="h-4 w-4" />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-[0.2em]">Clinical Intelligence</span>
                        </div>
                        <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Hilium Ai summary</Badge>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bricolage text-xl font-extrabold text-foreground">AI Medical Summary</h3>
                        {isSummarizing ? (
                          <div className="flex flex-col gap-2">
                            <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
                            <div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
                            <div className="h-4 w-1/2 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <p className="text-sm md:text-base text-neutral-950 dark:text-neutral-50 font-bold leading-relaxed italic border-l-2 border-primary/20 pl-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-2xl">
                            "{smartSummary || record.analysis?.summary || record.fallbackSummary || "Our AI engine is currently processing the clinical context of this file."}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          <img src="/hilium.png" alt="Hilium" className="h-3 w-3 object-contain dark:invert" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Verified by Hilium Clinical Platform</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Key Insights Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-neutral-800 dark:text-neutral-200">Clinical Insights</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {record.analysis?.insights?.length > 0 ? (
                      record.analysis.insights.map((insight: string, idx: number) => (
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + (idx * 0.05) }}
                          key={idx}
                          className="bg-white/50 dark:bg-white/5 p-6 rounded-3xl border border-black/[0.03] dark:border-white/[0.03] group hover:border-primary/20 transition-all cursor-default"
                        >
                          <div className="flex gap-4 items-center">
                            <div className="h-10 w-10 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] group-hover:bg-primary/5 flex items-center justify-center shrink-0 transition-colors">
                              <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm text-foreground font-bold leading-snug">{insight}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : record.type === "CLINICAL_NOTE" ? (
                      <div className="p-8 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-black/[0.03] dark:border-white/[0.03] flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Professional Assessment</p>
                          <p className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-widest">This record contains direct medical feedback.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-4">
                        <ClipboardList className="h-10 w-10 text-black/10 dark:text-white/10" />
                        <p className="text-xs text-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-widest text-center px-10">
                          Extracting detailed insights...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security & Action Footer */}
                <div className="bg-white/50 dark:bg-white/5 text-foreground p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 flex flex-col gap-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary/40 via-primary to-primary/40 opacity-50" />
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                    <Lock className="h-20 w-20" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Shield className="h-4 w-4" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-primary/80">Security Protocol</span>
                    </div>
                    <h4 className="font-bricolage text-lg font-extrabold">Data Governance</h4>
                    <p className="text-xs text-neutral-900 dark:text-neutral-200 font-medium leading-relaxed">
                      This clinical record is encrypted using AES-256 standards. Only you and authorized medical entities can view the full metadata.
                    </p>
                  </div>
                  <Button className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest hover:bg-primary transition-all cursor-pointer">
                    View Audit Log
                  </Button>
                </div>

              </div>
            </div>

            {/* Quick Actions Footer - Sticky */}
            <div className="p-6 md:p-8 bg-background dark:bg-[#0A0A0A] border-t border-black/[0.03] dark:border-white/[0.03] flex items-center gap-4 shrink-0">
              <Button
                onClick={() => {
                  if (record.url && record.url !== "N/A") {
                    window.open(record.url, "_blank");
                  } else {
                    toast.info("Processing original file...", {
                      description: "The source document is being synchronized from the clinical vault."
                    });
                  }
                }}
                className="flex-1 h-16 rounded-2xl bg-background border border-black/5 dark:border-white/5 text-foreground font-black text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Download className="h-5 w-5 text-primary" />
                <span>{record.type === "CLINICAL_NOTE" ? "View Report" : "Download Document"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => record.url && window.open(record.url, "_blank")}
                className="h-16 w-16 rounded-2xl border-neutral-300 dark:border-neutral-700 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-neutral-800 dark:text-neutral-200 cursor-pointer"
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
