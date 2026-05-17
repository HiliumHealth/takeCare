"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FileText, Calendar, Trash2, Loader2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityTableProps {
  records?: any[];
  onDelete?: (e: React.MouseEvent, id: string, type: string) => void;
  onView?: (record: any) => void;
  deletingId?: string | null;
}

export function ActivityTable({ records = [], onDelete, onView, deletingId }: ActivityTableProps) {
  const truncateWords = (text: string, maxWords: number) => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const hasRecords = records.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#070708] shadow-[0_4px_30px_rgba(0,0,0,0.02)] flex flex-col w-full"
    >
      {/* Encryption Header Indicator */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0e0f12] px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-950 dark:text-white">
            End-to-End Encrypted Health Records
          </span>
        </div>
      </div>

      <div className="overflow-x-auto w-full no-scrollbar">
        {!hasRecords ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
               <Calendar className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">No activities recorded</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-bold max-w-xs leading-relaxed">
              Your patient booklet and doctor notifications will appear here.
            </p>
          </div>
        ) : (
          <Table className="w-full min-w-[800px] border-collapse">
            <TableHeader className="bg-neutral-100/50 dark:bg-[#0f1115] border-b border-neutral-200 dark:border-neutral-800">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 pl-8 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px]">Date</TableHead>
                <TableHead className="py-4 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px]">Source Record</TableHead>
                <TableHead className="py-4 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px]">Type</TableHead>
                <TableHead className="py-4 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px]">Status</TableHead>
                <TableHead className="py-4 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px]">Clinical Summary</TableHead>
                <TableHead className="py-4 pr-8 font-black text-neutral-950 dark:text-white uppercase tracking-widest text-[9px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, idx) => (
                <TableRow 
                  key={record.id || idx} 
                  className={cn(
                    "group border-b border-neutral-200 dark:border-neutral-800/80 transition-all duration-300 hover:bg-neutral-50/40 dark:hover:bg-neutral-800/20",
                    idx % 2 === 0 
                      ? "bg-white dark:bg-[#070708]" 
                      : "bg-[#fcfcfd] dark:bg-[#0f1115]"
                  )}
                >
                  {/* Date Column */}
                  <TableCell className="py-4 pl-8 font-black text-xs text-neutral-950 dark:text-white shrink-0">
                    {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>

                  {/* Source Record Column */}
                  <TableCell className="py-4 font-black text-xs text-neutral-950 dark:text-white max-w-[160px] truncate">
                    {record.fileName}
                  </TableCell>

                  {/* Type Column */}
                  <TableCell className="py-4 font-black text-neutral-950 dark:text-neutral-300 text-[10px] uppercase tracking-wider italic shrink-0">
                    {record.type?.split(" ")[0]}
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-4 shrink-0">
                    <Badge className={cn(
                      "rounded-full font-black text-[8px] px-2.5 py-0.5 uppercase tracking-wider border-none shadow-xs",
                      record.analysis 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300" 
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                    )}>
                      {record.analysis ? "Verified" : "Evidence"}
                    </Badge>
                  </TableCell>

                  {/* Clinical Summary Column */}
                  <TableCell className="py-4 font-bold text-neutral-950 dark:text-white text-xs max-w-[300px]">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate">
                        {record.analysis?.summary || record.fallbackSummary || "Clinical calibration in progress..."}
                      </span>
                      {(record.analysis?.summary || record.fallbackSummary) && (
                        <button 
                          onClick={() => onView?.(record)}
                          className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline text-left mt-0.5 w-fit cursor-pointer"
                        >
                          Expand
                        </button>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="py-4 pr-8 text-right shrink-0">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        onClick={() => onView?.(record)}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-neutral-100 hover:bg-primary hover:text-white dark:bg-neutral-800 text-neutral-950 dark:text-white transition-all cursor-pointer border border-neutral-200/50 dark:border-neutral-700"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={(e) => onDelete?.(e, record.id, record.type)}
                        disabled={deletingId === record.id}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-neutral-100 hover:bg-red-500 hover:text-white dark:bg-neutral-800 text-neutral-950 dark:text-white transition-all cursor-pointer border border-neutral-200/50 dark:border-neutral-700"
                      >
                        {deletingId === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </motion.div>
  );
}
