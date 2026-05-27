"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { updateMyProfile, deleteMyAccount } from "../../app/actions/user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { ModeToggle } from "./mode-toggle";
import { PushSubscriptionButton } from "@/components/pwa/push-subscription-button";

interface EditProfileModalProps {
  user: {
    clerkId: string;
    name: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
  };
  onUpdate: () => void;
  customTrigger?: React.ReactNode;
}

export function EditProfileModal({ user, onUpdate, customTrigger }: EditProfileModalProps) {
  // Return early if user is null
  if (!user) {
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    avatarUrl: user?.avatarUrl || "",
    coverImageUrl: user?.coverImageUrl || "",
  });

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "avatarUrl" | "coverImageUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         toast.error("Image is too large. Please select an image under 2MB.");
         return;
      }
      const reader = new FileReader();
      reader.onloadstart = () => setLoading(true);
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
        setLoading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name) {
       toast.error("Name is required.");
       return;
    }
    setLoading(true);
    try {
      await updateMyProfile(formData);
      toast.success("Profile updated successfully!");
      onUpdate();
    } catch (error) {
       console.error("Update failed", error);
       toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      if (url.startsWith("data:")) return true;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog>
      <DialogTrigger 
        render={customTrigger as React.ReactElement || (
          <Button variant="outline" className="rounded-xl lg:rounded-2xl border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all px-4 lg:px-8 h-10 lg:h-12 shadow-sm whitespace-nowrap shrink-0 text-black dark:text-white cursor-pointer">
            Edit Profile
          </Button>
        )}
      />

      <DialogContent className="sm:max-w-[440px] rounded-2xl md:rounded-3xl bg-white dark:bg-[#0a0a0a] border-black/5 dark:border-white/5 p-5 md:p-6 overflow-hidden antialiased">
        <DialogHeader className="px-0 flex flex-row items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-2">
          <DialogTitle className="font-bricolage text-base md:text-lg font-black tracking-tight text-black dark:text-white">Edit Patient Profile</DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 hidden sm:block">Theme</span>
            <ModeToggle />
          </div>
        </DialogHeader>

        <div className="space-y-4.5 mt-2">
          {/* Cover Image */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Cover Image</Label>
            <div 
              className="relative group rounded-xl overflow-hidden h-24 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              <input 
                ref={coverInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverImageUrl")}
              />
              {formData.coverImageUrl && isValidUrl(formData.coverImageUrl) && (
                <div className="relative h-full w-full">
                  <img src={formData.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="text-white h-5 w-5" />
                <span className="text-[8px] text-white font-black uppercase mt-1">Upload Cover</span>
              </div>
            </div>
          </div>

          {/* Avatar and Name */}
          <div className="flex gap-4 items-start">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Avatar</Label>
                <div 
                  className="relative h-16 w-16 rounded-xl bg-primary/10 border-2 border-white/0 dark:border-white/5 shadow-md overflow-hidden group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                   <input 
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "avatarUrl")}
                   />
                   {formData.avatarUrl && isValidUrl(formData.avatarUrl) ? (
                     <>
                       <img src={formData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                       <div className="absolute inset-0 bg-black/10 dark:bg-black/30 pointer-events-none transition-colors" />
                     </>
                   ) : (
                     <User className="h-full w-full p-3 text-primary/40" />
                   )}
                   <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <Camera className="text-white h-4 w-4" />
                      <span className="text-[7px] text-white font-black uppercase mt-0.5">Upload</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 space-y-3">
               <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Full Name</Label>
                 <Input
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="h-10 rounded-xl border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-4 text-xs font-bold text-black dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a]"
                 />
               </div>
             </div>
          </div>

          <Button 
            onClick={handleUpdate} 
            disabled={loading}
            className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black/90 dark:hover:bg-white/90 shadow-md shadow-black/5 dark:shadow-white/5 cursor-pointer hover:scale-[1.01] transition-transform"
          >
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Profile Changes"}
          </Button>

          {/* Push Notifications */}
          <div className="pt-3.5 mt-1 border-t border-black/5 dark:border-white/5">
             <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Alerts & Notifications</Label>
             <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-1.5 border border-primary/10">
               <PushSubscriptionButton />
             </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-3.5 mt-1 border-t border-black/5 dark:border-white/5">
             <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/50 mb-2 block">Clinical Danger Zone</Label>
             <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                   <span className="text-xs font-bold text-red-600 dark:text-red-400">Delete medical records</span>
                   <span className="text-[9px] font-medium text-red-900/40 dark:text-red-400/45">This action permanently wipes all clinical data.</span>
                </div>
                <DeleteConfirm clerkId={user.clerkId} />
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ clerkId }: { clerkId: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    const toastId = toast.loading("Securely wiping your clinical data...");
    
    try {
      await deleteMyAccount();
      toast.success("Account and data successfully deleted.", { id: toastId });
      setTimeout(async () => {
        await signOut({ callbackUrl: "/" });
      }, 1500);
    } catch (e) {
      toast.error("Failed to delete account. Please try again.", { id: toastId });
      setDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setOpen(true)}
        className="h-8.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-[9px] uppercase tracking-wider hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all px-3 cursor-pointer"
      >
        Delete Data
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl bg-white dark:bg-[#0a0a0a] p-5.5 border border-black/5 dark:border-white/5 shadow-2xl dark:shadow-black/50">
          <DialogHeader className="items-center text-center">
             <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-3">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
             </div>
             <DialogTitle className="font-bricolage text-base font-black tracking-tight text-black dark:text-white">Are you absolutely sure?</DialogTitle>
             <p className="text-xs text-black/50 dark:text-white/50 font-semibold mt-1.5 leading-relaxed">
                This action is IRREVERSIBLE. It will permanently delete your medical history, health goals, and AI analysis reports.
             </p>
          </DialogHeader>
          <div className="flex gap-2.5 mt-5">
             <Button 
               variant="outline" 
               className="flex-1 h-9.5 rounded-lg font-bold text-xs border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white cursor-pointer" 
               onClick={() => setOpen(false)}
             >
               Cancel
             </Button>
             <Button 
               className="flex-1 h-9.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-md shadow-red-200/50 cursor-pointer" 
               onClick={handleDelete}
               disabled={deleting}
             >
               {deleting ? "Deleting..." : "Yes, Wipe It"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
