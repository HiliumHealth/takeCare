"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a0a0a] dark:to-[#111] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-sm"
      >
        {/* Animated icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mx-auto w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-8"
        >
          <WifiOff className="h-10 w-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-[family-name:var(--font-bricolage)]">
          You&apos;re Offline
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry — your health data
          is safe. Please check your connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-primary text-white py-3 px-6 rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <p className="mt-10 text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest font-semibold">
          Hilium Health • Offline Mode
        </p>
      </motion.div>
    </div>
  );
}
