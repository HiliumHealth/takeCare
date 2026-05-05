"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, MessageSquare, Bell, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messenger", label: "Messenger", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "smart-care", label: "Smart Care", icon: Plus },
];

export function DashboardTabs({
  value,
  onValueChange,
  notificationCount = 0,
  messengerCount = 0
}: {
  value: string;
  onValueChange: (val: string) => void;
  notificationCount?: number;
  messengerCount?: number;
}) {
  return (
    <div className="px-4 md:px-0">
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="bg-black/[0.04] p-1.5 rounded-xl w-full lg:w-fit h-auto flex gap-2 overflow-x-auto no-scrollbar border border-black/[0.03] shadow-none relative">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "rounded-sm px-6 py-4 md:px-16 md:py-6 transition-all duration-500 cursor-pointer whitespace-nowrap relative group shrink-0",
                "data-active:!text-white data-active:!bg-primary data-active:shadow-lg data-active:shadow-primary/20",
                "text-black hover:text-black/70 bg-transparent",
                "flex items-center justify-center gap-4 md:gap-6 font-outfit font-black text-xs md:text-xl capitalize tracking-normal border border-transparent"
              )}
            >
              <div className="relative">
                <tab.icon className={cn(
                  "h-4 w-4 md:h-7 md:w-7 transition-transform duration-500 group-hover:scale-110",
                  value === tab.id ? "text-white" : "text-black/60",
                  tab.id === "smart-care" && value !== "smart-care" && "text-vital-orange animate-pulse"
                )} />

                {/* Messenger Badge */}
                {tab.id === "messenger" && messengerCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-linear-to-tr from-[#25D366] to-[#128C7E] text-[8px] md:text-[11px] font-black text-white shadow-lg shadow-[#25D366]/40 border-2 border-white"
                  >
                    {messengerCount}
                  </motion.span>
                )}

                {/* Notifications Badge */}
                {tab.id === "notifications" && notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-linear-to-tr from-[#FF3B30] to-[#D70015] text-[8px] md:text-[11px] font-black text-white shadow-lg shadow-[#FF3B30]/40 border-2 border-white"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </motion.span>
                )}
              </div>

              <span className={cn(
                "capitalize text-xs md:text-lg font-black tracking-tight transition-colors duration-500",
                value === tab.id ? "text-white" : "text-black"
              )}>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
