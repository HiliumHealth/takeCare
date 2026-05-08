"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      toast.success("Account created successfully!");

      // Auto Sign In after signing up
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInRes?.error) {
        toast.error("Failed to auto-login. Please sign in manually.");
        router.push("/signin");
      } else {
        // New user — send to personalization choice
        router.push("/personalization-choice");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/50 dark:border-white/10 z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 bg-black dark:bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-white/10"
          >
            <User className="w-8 h-8 text-white dark:text-black" />
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
            Join us today and personalize your health journey.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 dark:text-white/80">Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-white/40" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="pl-10 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-white/40"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-white/80">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-white/40" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-white/40"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-white/80">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-white/40" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus-visible:ring-blue-500 focus-visible:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-white/40"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-xl py-6 text-base font-semibold shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign Up
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-white/60">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
