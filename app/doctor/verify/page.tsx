"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActivitySquare, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorVerifyPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/doctor/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Save credentials/invite access in local storage for session
      localStorage.setItem("takecare_doctor_invite", data.inviteId);
      localStorage.setItem("takecare_doctor_verified", "true");
      
      // Navigate to patient context dashboard immediately
      setTimeout(() => {
        router.push(`/doctor/dashboard/${data.inviteId}`);
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/2 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-4xl p-8 lg:p-10 shadow-2xl border border-black/5 relative overflow-hidden"
      >
        {/* Decorative background blur */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 mb-6">
            <ActivitySquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bricolage font-black tracking-tight text-black mb-2">Doctor Portal</h1>
          <p className="text-black/50 text-sm font-medium px-4">
            Enter your email and the secure access code sent by your patient.
          </p>
        </div>

        <form onSubmit={handleVerify} className="relative z-10 grid gap-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40 pl-1">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/30" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="h-14 rounded-2xl bg-black/5 border-none pl-12 font-semibold text-black focus-visible:ring-2 focus-visible:ring-black placeholder:text-black/30"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40 pl-1">
              Access Code (OTP)
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/30" />
              <Input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="h-14 rounded-2xl bg-black/5 border-none pl-12 font-bold tracking-widest text-black focus-visible:ring-2 focus-visible:ring-black placeholder:text-black/30"
                maxLength={6}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-14 w-full bg-black hover:bg-black/80 text-white rounded-2xl font-bold text-lg mt-2 transition-all shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Access Patient Record"}
          </Button>

          <p className="text-[11px] text-center text-black/40 font-medium mt-4">
            Protected by Hilium HIPAA-Compliant Gateway
          </p>
        </form>
      </motion.div>
    </div>
  );
}
