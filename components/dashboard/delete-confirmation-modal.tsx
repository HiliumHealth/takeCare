"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description
}: DeleteConfirmationModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className="w-[90vw] sm:max-w-[420px] rounded-[3.5rem] bg-background p-12 md:p-14 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden"
      >
        <DialogClose className="absolute right-10 top-10 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-black/20 dark:text-white/20 hover:text-black/60 dark:hover:text-white/60 cursor-pointer">
          <X className="h-5 w-5" />
        </DialogClose>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <DialogHeader className="items-center text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-3xl animate-pulse" />
            <AlertTriangle className="h-10 w-10 text-red-500 relative z-10" />
          </motion.div>
          
          <div className="space-y-3">
            <DialogTitle className="font-bricolage text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <p className="text-sm md:text-base text-black/50 dark:text-white/50 font-medium leading-relaxed px-2">
              {description}
            </p>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-10 px-2">
          <Button 
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-red-600 text-white font-black text-xs md:text-sm uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-red-900/20 transition-all flex items-center justify-center gap-3 order-1 cursor-pointer disabled:cursor-not-allowed" 
            onClick={handleConfirm}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                <span>Confirm Delete</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            disabled={loading}
            className="w-full h-14 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-foreground transition-all order-2 cursor-pointer disabled:cursor-not-allowed" 
            onClick={onClose}
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/20">
            This action is irreversible
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
