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
      className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border border-black/[0.04] bg-white p-5 md:p-8 transition-all duration-700 hover:-translate-y-2"
      style={{
        boxShadow: `
          0 10px 30px -5px rgba(0,0,0,0.03),
          0 20px 50px -15px rgba(0,0,0,0.08),
          0 0 0 1px rgba(0,0,0,0.01)
        `
      }}
    >
      {/* Hyper-Artistic Glow Background */}
      <div className={cn(
        "absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-[70px] transition-all duration-1000 group-hover:scale-150 group-hover:opacity-20",
        colorClass
      )} />
      
      {/* Floating Glass Element */}
      <div className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-black/[0.02] backdrop-blur-sm border border-black/[0.03] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-1 group-hover:-translate-y-1">
         <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-700 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.15)] group-hover:rotate-[12deg] group-hover:scale-110",
            colorClass,
            colorClass === "bg-blue-600" ? "shadow-blue-600/30" : 
            colorClass === "bg-vital-orange" ? "shadow-orange-600/30" : 
            "shadow-emerald-600/30"
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black/20 group-hover:text-black/80 transition-all duration-500">
              {title}
            </span>
            <div className={cn(
              "h-1 w-8 rounded-full mt-1.5 transition-all duration-700 group-hover:w-12",
              colorClass
            )} style={{ opacity: 0.15 }} />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bricolage text-4xl md:text-5xl font-black tracking-tighter text-black leading-none"
            >
              {value.replace('%', '')}
            </motion.span>
            {value.includes('%') && (
              <span className="text-base font-black text-black/20 uppercase tracking-tighter -translate-y-4">%</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-3">
            <span className="font-outfit text-[10px] font-black text-black/30 uppercase tracking-widest group-hover:text-black/50 transition-colors">
              {subtitle}
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          </div>
        </div>
      </div>

      {/* Decorative Gradient Border on hover */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const doctorsCount = stats?.doctorsCount ?? 0;
  const recordsCount = stats?.recordsCount ?? 0;
  const healthScore = stats?.healthScore ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3 px-0 lg:px-0">
      <StatCard
        title="Network"
        value={doctorsCount.toString()}
        subtitle="Doctors Invited"
        icon={Users}
        delay={0.1}
        colorClass="bg-blue-600"
      />
      <StatCard
        title="Check-ins"
        value={recordsCount.toString()}
        subtitle="Clinical Records"
        icon={Building2}
        delay={0.2}
        colorClass="bg-vital-orange"
      />
      <StatCard
        title="Intelligence"
        value={`${healthScore}%`}
        subtitle="Health Score"
        icon={Activity}
        delay={0.3}
        colorClass="bg-emerald-500"
      />
    </div>
  );
}

