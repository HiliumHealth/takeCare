"use client";

import React from "react";
import { LayoutDashboard, MessageSquare, Bell, Plus, LogOut, Settings, User, Heart, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messenger", label: "Messenger", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "smart-care", label: "Smart Care", icon: Plus, highlight: true },
];

export function DashboardSidebar({
  value,
  onValueChange,
  notificationCount = 0,
  messengerCount = 0,
  user
}: {
  value: string;
  onValueChange: (val: string) => void;
  notificationCount?: number;
  messengerCount?: number;
  user?: any;
}) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-black/[0.04] z-50 hidden lg:flex flex-col shadow-[20px_0_50px_-20px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-8 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center shadow-2xl shadow-black/20">
          <Heart className="h-6 w-6 text-white fill-white/10" />
        </div>
        <div>
          <h1 className="font-bricolage text-2xl font-black tracking-tighter text-black">TakeCare</h1>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 leading-none">Everything is ready</span>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        <div className="px-4 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Menu</span>
        </div>
        
        {NAV_ITEMS.map((item) => {
          const isActive = value === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onValueChange(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-black text-white shadow-xl shadow-black/10" 
                  : "text-black/50 hover:text-black hover:bg-black/[0.03]"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "h-6 w-6 transition-transform duration-500 group-hover:scale-110",
                  isActive ? "text-white" : "text-black/40",
                  item.highlight && !isActive && "text-primary animate-pulse"
                )} />
                
                {/* Badge Logic */}
                {item.id === "messenger" && messengerCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {messengerCount}
                  </span>
                )}
                {item.id === "notifications" && notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-vital-orange text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "font-bold text-sm tracking-tight capitalize",
                isActive ? "text-white" : "text-black/60"
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </button>
          );
        })}

        <div className="px-4 pt-10 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Help & Security</span>
        </div>
        
        <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-black/40 hover:text-black hover:bg-black/[0.03] transition-all group">
          <Settings className="h-6 w-6 group-hover:rotate-45 transition-transform duration-500" />
          <span className="font-bold text-sm tracking-tight">Account Settings</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-black/40 hover:text-black hover:bg-black/[0.03] transition-all group">
          <ShieldCheck className="h-6 w-6" />
          <span className="font-bold text-sm tracking-tight">Secure Records</span>
        </button>
      </nav>

      {/* User & Footer */}
      <div className="p-4 mt-auto">
        <div className="bg-black/[0.02] border border-black/[0.03] rounded-3xl p-4 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-black/20" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-black truncate">{user?.name || "Patient"}</p>
              <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest truncate">Secure Account</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => signOut()}
            className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-red-50 hover:text-red-500 text-black/40 transition-all font-bold text-xs"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="px-4 py-2 flex items-center justify-between opacity-20">
          <p className="text-[8px] font-black uppercase tracking-widest">TakeCare v2.0</p>
          <Activity className="h-3 w-3" />
        </div>
      </div>
    </aside>
  );
}
