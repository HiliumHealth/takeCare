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
import { FileText, Calendar, Building2, User, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
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

  // If no real records, we can show a placeholder message or empty state
  const hasRecords = records.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-0 lg:mx-0 mt-4 mb-20 overflow-hidden rounded-[2.5rem] border border-black/5 bg-white shadow-medical flex flex-col"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black/5 bg-black/1 px-8 py-7 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <p className="text-xs font-bold text-black/60 lg:text-sm">Secure patient access • Verified chronology</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-2xl border-black/5 bg-black/5 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all px-8 h-12 shadow-sm text-black">
          {hasRecords ? "View Full Timeline" : "No Records Available"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        {!hasRecords ? (
          <div className="flex flex-col items-center justify-center py-20 bg-black/1 px-6 text-center">
            <div className="h-20 w-20 rounded-4xl bg-black/5 flex items-center justify-center mb-6 animate-pulse">
               <Calendar className="h-10 w-10 text-black/20" />
            </div>
            <p className="text-sm font-black text-black/40 uppercase tracking-[0.3em]">Awaiting clinical verification</p>
            <p className="text-xs text-black/30 mt-3 font-bold max-w-xs leading-relaxed">Capture your first record in the Smart Care tab to populate this list.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table className="w-full">
                <TableHeader className="bg-black/3">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-6 pl-10 font-black text-black/80 uppercase tracking-[0.2em] text-[10px]">Date</TableHead>
                    <TableHead className="py-6 font-black text-black/80 uppercase tracking-[0.2em] text-[10px]">Source Record</TableHead>
                    <TableHead className="py-6 font-black text-black/80 uppercase tracking-[0.2em] text-[10px] hidden lg:table-cell">Type</TableHead>
                    <TableHead className="py-6 font-black text-black/80 uppercase tracking-[0.2em] text-[10px]">Status</TableHead>
                    <TableHead className="py-6 font-black text-black/80 uppercase tracking-[0.2em] text-[10px]">Clinical Summary</TableHead>
                    <TableHead className="py-6 pr-10 font-black text-black/80 uppercase tracking-[0.2em] text-[10px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, idx) => (
                    <TableRow key={record.id || idx} className="group hover:bg-black/2 border-black/5 transition-all duration-300">
                      <TableCell className="py-7 pl-10 font-black text-sm text-black">
                        {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="py-7 font-black text-sm lg:text-base text-black group-hover:text-primary transition-colors">
                        {record.fileName}
                      </TableCell>
                      <TableCell className="py-7 font-black text-black/80 text-sm hidden lg:table-cell italic">{record.type}</TableCell>
                      <TableCell className="py-7">
                        <Badge className={cn(
                          "rounded-full font-black text-[9px] px-3 py-1 uppercase tracking-wider border-none shadow-sm",
                          record.analysis ? "bg-emerald-500/10 text-emerald-600" : 
                          record.type === "CLINICAL_ASSESSMENT" ? "bg-blue-500/10 text-blue-600" :
                          record.type === "CLINICAL_NOTE" ? "bg-primary/10 text-primary" :
                          "bg-amber-500/10 text-amber-600"
                        )}>
                          {record.analysis ? "Verified" : 
                           record.type === "CLINICAL_ASSESSMENT" ? "Evidence" : 
                           record.type === "CLINICAL_NOTE" ? "Assessment" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-7">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-black text-sm max-w-[300px] leading-snug">
                            {truncateWords(record.analysis?.summary || record.fallbackSummary || "Analyzing context...", 29)}
                          </span>
                          {(record.analysis?.summary || record.fallbackSummary)?.split(/\s+/).length > 29 && (
                            <button 
                              onClick={() => onView?.(record)}
                              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline text-left mt-1"
                            >
                              Read More
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-7 pr-10 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Button 
                            onClick={() => onView?.(record)}
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 cursor-pointer"
                          >
                            <FileText className="h-5 w-5" />
                          </Button>
                          <Button 
                            onClick={(e) => onDelete?.(e, record.id, record.type)}
                            disabled={deletingId === record.id}
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-2xl bg-red-500 shadow-lg shadow-red-500/20 text-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 delay-75 cursor-pointer"
                          >
                            {deletingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Table View (Horizontal Scroll) */}
            <div className="md:hidden overflow-x-auto no-scrollbar">
              <Table className="min-w-[700px]">
                <TableHeader className="bg-black/3">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-5 pl-6 font-black text-black/60 uppercase tracking-[0.2em] text-[9px]">Date</TableHead>
                    <TableHead className="py-5 font-black text-black/60 uppercase tracking-[0.2em] text-[9px]">Source Record</TableHead>
                    <TableHead className="py-5 font-black text-black/60 uppercase tracking-[0.2em] text-[9px]">Status</TableHead>
                    <TableHead className="py-5 font-black text-black/60 uppercase tracking-[0.2em] text-[9px]">Summary</TableHead>
                    <TableHead className="py-5 pr-6 font-black text-black/60 uppercase tracking-[0.2em] text-[9px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, idx) => (
                    <TableRow key={record.id || idx} className="active:bg-black/2 border-black/5 transition-all">
                      <TableCell className="py-6 pl-6 font-black text-xs text-black">
                        {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="py-6 font-black text-xs text-black">
                        <div className="flex flex-col gap-0.5">
                          <span>{record.fileName}</span>
                          <span className="text-[8px] font-black text-black/60 italic uppercase">{record.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge className={cn(
                          "rounded-full font-black text-[7px] px-2 py-0.5 uppercase tracking-wider border-none shadow-sm",
                          record.analysis ? "bg-emerald-500/10 text-emerald-600" : 
                          "bg-amber-500/10 text-amber-600"
                        )}>
                          {record.analysis ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="font-bold text-black text-xs line-clamp-1 max-w-[150px]">
                          {record.analysis?.summary || record.fallbackSummary || "Analyzing..."}
                        </span>
                      </TableCell>
                      <TableCell className="py-6 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={() => onView?.(record)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl bg-primary text-white shadow-md shadow-primary/20"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={(e) => onDelete?.(e, record.id, record.type)}
                            disabled={deletingId === record.id}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl bg-red-500 text-white shadow-md shadow-red-500/20"
                          >
                            {deletingId === record.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
