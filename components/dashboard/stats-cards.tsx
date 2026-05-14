"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Building2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay?: number;
}

interface StatsCardsProps {
  stats?: {
    doctorsCount: number;
    recordsCount: number;
    healthScore: number;
  };
}

function StatCard({ title, value, subtitle, icon: Icon, delay = 0, colorClass = "bg-primary" }: StatCardProps & { colorClass?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl md:rounded-3xl border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-white/5 p-2.5 md:p-6 transition-all duration-700 hover:-translate-y-2 shadow-[0_5px_15px_-3px_rgba(0,0,0,0.03),0_10px_25px_-5px_rgba(0,0,0,0.05)] md:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03),0_20px_50px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.01)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2),0_20px_50px_-15px_rgba(0,0,0,0.4)]"
    >
      {/* Hyper-Artistic Glow Background */}
      <div className={cn(
        "absolute -right-8 -top-8 md:-right-16 md:-top-16 h-24 w-24 md:h-48 md:w-48 rounded-full opacity-10 dark:opacity-5 blur-[40px] md:blur-[70px] transition-all duration-1000 group-hover:scale-150 group-hover:opacity-20 dark:group-hover:opacity-10",
        colorClass
      )} />
      
      {/* Floating Glass Element */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 h-8 w-8 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm border border-black/[0.03] dark:border-white/[0.03] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-1 group-hover:-translate-y-1">
         <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="relative flex flex-col gap-2 md:gap-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-6 w-6 md:h-9 md:w-9 items-center justify-center rounded-lg md:rounded-xl transition-all duration-700 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.15)] group-hover:rotate-[12deg] group-hover:scale-110",
            colorClass,
            colorClass === "bg-blue-600" ? "shadow-blue-600/30" : 
            colorClass === "bg-vital-orange" ? "shadow-orange-600/30" : 
            "shadow-emerald-600/30"
          )}>
            <Icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] text-black/40 dark:text-white/40 group-hover:text-black/80 dark:group-hover:text-white/80 transition-all duration-500">
              {title}
            </span>
            <div className={cn(
              "h-0.5 w-4 md:h-1 md:w-8 rounded-full mt-1 transition-all duration-700 group-hover:w-6 md:group-hover:w-12",
              colorClass
            )} style={{ opacity: 0.15 }} />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bricolage text-xl md:text-4xl font-black tracking-tighter text-black dark:text-white leading-none"
            >
              {value.replace('%', '')}
            </motion.span>
            {value.includes('%') && (
              <span className="text-[10px] md:text-base font-black text-black/40 dark:text-white/40 uppercase tracking-tighter -translate-y-2 md:-translate-y-4">%</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2.5 mt-1 md:mt-2">
            <span className="font-outfit text-[8px] md:text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider md:tracking-widest group-hover:text-black/80 dark:group-hover:text-white/80 transition-colors truncate">
              {subtitle.split(' ')[0]}
            </span>
            <div className="h-1 w-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0" />
          </div>
        </div>
      </div>

      {/* Decorative Gradient Border on hover */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const doctorsCount = stats?.doctorsCount ?? 0;
  const recordsCount = stats?.recordsCount ?? 0;
  const healthScore = stats?.healthScore ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-0">
      <StatCard
        title="Network"
        value={doctorsCount.toString()}
        subtitle="Doctors"
        icon={Users}
        delay={0.1}
        colorClass="bg-blue-600"
      />
      <div className="grid grid-cols-2 gap-4 sm:hidden">
        <StatCard
          title="Records"
          value={recordsCount.toString()}
          subtitle="Clinical"
          icon={Building2}
          delay={0.2}
          colorClass="bg-vital-orange"
        />
        <StatCard
          title="Health"
          value={`${healthScore}%`}
          subtitle="Score"
          icon={Activity}
          delay={0.3}
          colorClass="bg-emerald-500"
        />
      </div>
      {/* Desktop view for records/health */}
      <div className="hidden sm:contents">
        <StatCard
          title="Records"
          value={recordsCount.toString()}
          subtitle="Clinical"
          icon={Building2}
          delay={0.2}
          colorClass="bg-vital-orange"
        />
        <StatCard
          title="Health"
          value={`${healthScore}%`}
          subtitle="Score"
          icon={Activity}
          delay={0.3}
          colorClass="bg-emerald-500"
        />
      </div>
    </div>
  );
}

