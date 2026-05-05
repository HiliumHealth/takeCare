"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, MessageSquare, Bell, Plus, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "overview", label: "Home", icon: LayoutDashboard },
  { id: "messenger", label: "Care", icon: MessageSquare },
  { id: "smart-care", label: "Analyze", icon: Plus, isAction: true },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "ai", label: "Assistant", icon: Brain },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  messengerCount?: number;
  notificationCount?: number;
}

export function MobileNav({ activeTab, onTabChange, messengerCount = 0, notificationCount = 0 }: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 pointer-events-none">
      <div className="max-w-md mx-auto w-full pointer-events-auto px-4">
        <nav className="bg-primary backdrop-blur-3xl rounded-[28px] border border-white/20 p-1.5 shadow-2xl shadow-primary/30 flex items-center justify-between">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative -top-4 bg-white h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-black/10 active:scale-90 transition-transform group border-4 border-primary"
                >
                  <Icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white rounded-full -z-10"
                  />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex-1 flex flex-col items-center justify-center py-2 gap-1 group"
              >
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-300",
                  isActive ? "bg-white/20 text-white scale-110 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/5"
                )}>
                  <Icon className="h-6 w-6 stroke-[2.5px]" />

                  {item.id === "messenger" && messengerCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-vital-orange rounded-full border-2 border-primary text-[8px] font-black text-white flex items-center justify-center">
                      {messengerCount}
                    </span>
                  )}

                  {item.id === "notifications" && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-primary text-[8px] font-black text-white flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-black text-white uppercase tracking-widest transition-opacity duration-300",
                  isActive ? "opacity-100 text-white" : "opacity-60"
                )}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 h-1 w-1 bg-white rounded-full shadow-lg shadow-white/50"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
