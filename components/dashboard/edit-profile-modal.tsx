"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { updateMyProfile, deleteMyAccount } from "@/app/actions/medical";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { ModeToggle } from "./mode-toggle";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    avatarUrl: user.avatarUrl || "",
    coverImageUrl: user.coverImageUrl || "",
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
          <Button variant="outline" className="rounded-xl lg:rounded-2xl border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all px-4 lg:px-8 h-10 lg:h-12 shadow-sm whitespace-nowrap shrink-0 text-black dark:text-white">
            Edit Profile
          </Button>
        )}
      />

      <DialogContent className="sm:max-w-xl rounded-3xl md:rounded-5xl bg-white dark:bg-[#0a0a0a] border-black/5 dark:border-white/5 p-8 overflow-hidden">
        <DialogHeader className="px-0 md:px-2 flex flex-row items-center justify-between">
          <DialogTitle className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tighter text-black dark:text-white">Edit Patient Profile</DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 hidden sm:block">Theme</span>
            <ModeToggle />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Cover Image</Label>
            <div 
              className="relative group rounded-3xl overflow-hidden h-32 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 cursor-pointer"
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
                  <div className="absolute inset-0 bg-black/10 dark:bg-black/50 pointer-events-none" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="text-white h-8 w-8" />
                <span className="text-[10px] text-white font-black uppercase mt-2">Click to Upload</span>
              </div>
            </div>
          </div>

          {/* Avatar and Name */}
          <div className="flex gap-6 items-start">
             <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Avatar</Label>
                <div 
                  className="relative h-24 w-24 rounded-3xl bg-primary/10 border-4 border-white/0 dark:border-white/5 shadow-xl overflow-hidden group cursor-pointer"
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
                       <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none transition-colors" />
                     </>
                   ) : (
                     <User className="h-full w-full p-4 text-primary/40" />
                   )}
                   <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <Camera className="text-white h-5 w-5" />
                      <span className="text-[8px] text-white font-black uppercase mt-1">Upload</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 space-y-4">
               <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30">Full Name</Label>
                 <Input
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="h-14 rounded-2xl border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-6 text-lg font-bold text-black dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a]"
                 />
               </div>
             </div>
          </div>

          <Button 
            onClick={handleUpdate} 
            disabled={loading}
            className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 dark:hover:bg-white/90 shadow-xl shadow-black/10 dark:shadow-white/10"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Profile Changes"}
          </Button>

          {/* Danger Zone */}
          <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5">
             <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/50 mb-4 block">Clinical Danger Zone</Label>
             <div className="p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                   <span className="text-sm font-bold text-red-600 dark:text-red-400">Delete medical records</span>
                   <span className="text-[10px] font-medium text-red-900/40 dark:text-red-400/40">This will permanently wipe all your clinical data.</span>
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
        className="h-10 rounded-xl bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all px-4"
      >
        Delete Data
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-4xl bg-white dark:bg-[#0a0a0a] p-8 border-none shadow-2xl dark:shadow-black/50">
          <DialogHeader className="items-center text-center">
             <div className="h-16 w-16 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
             </div>
             <DialogTitle className="font-bricolage text-2xl font-extrabold tracking-tight text-black dark:text-white">Are you absolutely sure?</DialogTitle>
             <p className="text-sm text-black/50 dark:text-white/50 font-medium mt-2">
                This action is IRREVERSIBLE. It will permanently delete your medical history, health goals, and AI analysis reports.
             </p>
          </DialogHeader>
          <div className="flex gap-3 mt-8">
             <Button 
               variant="outline" 
               className="flex-1 h-12 rounded-xl font-bold border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white" 
               onClick={() => setOpen(false)}
             >
               Cancel
             </Button>
             <Button 
               className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200" 
               onClick={handleDelete}
               disabled={deleting}
             >
               {deleting ? "Deleting..." : "Yes, Delete Everything"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
