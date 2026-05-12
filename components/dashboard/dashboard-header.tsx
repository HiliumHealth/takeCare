"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Search, Settings, LogOut } from "lucide-react";
import { EditProfileModal } from "./edit-profile-modal";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: any;
  notificationCount?: number;
}

export function DashboardHeader({ user, notificationCount = 0 }: DashboardHeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState(user);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    // Clear the personalized cookie server-side
    const { logoutUser } = await import("@/app/actions/medical");
    await logoutUser();
    // Sign out via NextAuth (clears session cookie)
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 lg:px-0 lg:py-4 w-full">

      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex h-12 w-12 items-center justify-center lg:h-16 lg:w-16 overflow-hidden">
           <img src="/hilium.png" alt="Hilium Logo" className="w-full h-full object-contain dark:invert" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-outfit text-sm font-bold tracking-tight lg:text-xl leading-none truncate dark:text-white">Hilium</span>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-black/60 dark:text-white/60 lg:text-[10px]">Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="hidden items-center gap-2 rounded-full lg:flex transition-all">
          <Search className="h-4 w-4 text-black/60 dark:text-white/60" />
          <input 
            type="text" 
            placeholder="Search health records..." 
            className="bg-transparent text-sm font-medium outline-none placeholder:text-black/30 dark:placeholder:text-white/30 text-black dark:text-white"
          />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative">
            <Button variant="ghost" size="icon" className="flex rounded-full hover:bg-black/5 dark:hover:bg-white/5 h-9 w-9 lg:h-10 lg:w-10">
              <Bell className="h-5 w-5 text-black dark:text-white" />
            </Button>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white animate-in zoom-in duration-300">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>

          <div className="hidden lg:block h-8 w-px bg-black/10 dark:bg-white/10 mx-2" />
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="lg:block">
              <EditProfileModal user={user || { id: "guest", name: "Guest", avatarUrl: null, coverImageUrl: null }} onUpdate={handleUpdate} />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-black leading-none text-black dark:text-white">{user?.name || "Patient"}</span>
                <span className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider mt-1 cursor-pointer hover:text-red-600 transition-colors flex items-center gap-2" onClick={handleLogout}>
                   Log out
                </span>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white/0 dark:border-white/5 shadow-lg lg:h-12 lg:w-12 relative overflow-hidden">
                <AvatarImage src={user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"} className="object-cover" />
                <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none" />
                <AvatarFallback className="bg-primary text-white font-bold">{user?.name?.slice(0, 2).toUpperCase() || "PT"}</AvatarFallback>
              </Avatar>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
