"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, FileText, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay?: number;
  colorClass: string;
  cardBg: string;
}

function StatCard({ title, value, subtitle, icon: Icon, delay = 0, colorClass, cardBg }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-black/[0.08] dark:border-white/[0.08] p-3 md:p-6 transition-all duration-300 hover:scale-[1.01] shadow-[0_2px_12px_rgba(0,0,0,0.01)]",
        cardBg
      )}
    >
      <div className="flex items-center justify-between w-full">
        {/* Soothing Compact Icon Hub */}
        <div className={cn(
          "flex h-7 w-7 md:h-10 md:w-10 items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 shrink-0",
          colorClass
        )}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-neutral-800 dark:text-neutral-200">
          {title}
        </span>
      </div>

      <div className="flex flex-col mt-3 md:mt-6">
        <span className="font-bricolage text-lg md:text-3xl font-black tracking-tight text-black dark:text-white leading-none">
          {value}
        </span>
        <span className="text-[9px] md:text-xs font-bold text-neutral-700 dark:text-neutral-300 mt-1 md:mt-2 truncate">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
}

export function StatsCards({ stats }: { stats?: { doctorsCount: number; recordsCount: number; healthScore: number } }) {
  const doctorsCount = stats?.doctorsCount ?? 0;
  const recordsCount = stats?.recordsCount ?? 0;
  const healthScore = stats?.healthScore ?? 0;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-6 px-0">
      <StatCard
        title="Care Team"
        value={doctorsCount.toString()}
        subtitle="Specialists"
        icon={Users}
        delay={0.05}
        colorClass="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
        cardBg="bg-blue-50/30 dark:bg-blue-950/20"
      />
      <StatCard
        title="My Records"
        value={recordsCount.toString()}
        subtitle="Reports"
        icon={FileText}
        delay={0.1}
        colorClass="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        cardBg="bg-amber-50/30 dark:bg-amber-950/20"
      />
      <StatCard
        title="AI Insights"
        value={`${healthScore}%`}
        subtitle="AI Analyzed"
        icon={Heart}
        delay={0.15}
        colorClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
        cardBg="bg-emerald-50/30 dark:bg-emerald-950/20"
      />
    </div>
  );
}
