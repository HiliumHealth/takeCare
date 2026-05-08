"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // If signed in + personalized, middleware handles redirect.
  // But if they land here while loading, show the page anyway.

  return (
    <main className="relative h-screen w-full overflow-hidden bg-white dark:bg-[#0a0a0a] font-sans text-black dark:text-white selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black transition-colors duration-500">
      {/* Background Decorative Elements - Subtle and Premium */}
      <div className="absolute top-0 left-0 h-full w-full pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[70%] rounded-full bg-blue-100/50 dark:bg-blue-900/30 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] h-[40%] w-[60%] rounded-full bg-orange-100/50 dark:bg-orange-900/30 blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[30%] w-[40%] rounded-full bg-teal-50 dark:bg-teal-900/20 blur-[80px]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col px-6 py-8 lg:px-16 lg:py-12">
        {/* Header / Logo */}
        <header className="mb-6 lg:mb-12 animate-slide-right">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black dark:bg-white shadow-2xl lg:h-14 lg:w-14">
              <span className="font-syne text-xl font-extrabold text-white dark:text-black lg:text-3xl">T</span>
            </div>
            <div className="flex flex-col">
              <span className="font-outfit text-lg font-bold tracking-tight lg:text-2xl leading-none text-black dark:text-white">TakeCare AI</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 dark:text-white/40 lg:text-xs">Intelligence</span>
            </div>
          </div>
        </header>

        {/* Hero Section - Responsive Grid */}
        <section className="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">

          {/* Left Content Column */}
          <div className="z-20 flex flex-col items-start justify-center">
            <div className="animate-fade-up">
              <h1 className="font-bricolage text-[48px] font-extrabold leading-[0.95] tracking-tighter lg:text-[100px] lg:leading-[0.9] text-black dark:text-white">
                Tailored care <br />
                for your <br />
                <span className="relative inline-block text-primary">
                  unique needs.
                  <div className="absolute -bottom-2 left-0 h-2 w-full bg-primary/10 lg:h-4" />
                </span>
              </h1>

              <p className="mt-6 max-w-[280px] font-outfit text-base leading-relaxed text-black/50 dark:text-white/50 lg:mt-10 lg:max-w-[480px] lg:text-2xl">
                Your intelligent health companion powered by AI. Personalized healthcare starts here, designed precisely for you.
              </p>
            </div>

            {/* CTA Button Section */}
            <div className="mt-10 flex items-center gap-6 lg:mt-16 animate-scale-in">
              <Button
                size="lg"
                onClick={() => {
                  if (status === "authenticated") {
                    router.push("/dashboard");
                  } else {
                    router.push("/signup");
                  }
                }}
                className="h-14 rounded-full cursor-pointer bg-black dark:bg-white px-8 text-base font-bold text-white dark:text-black transition-all hover:scale-105 hover:bg-black/90 dark:hover:bg-white/90 active:scale-95 lg:h-20 lg:px-12 lg:text-xl"
              >
                {status === "authenticated" ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-5 w-5 lg:h-6 lg:w-6" />
              </Button>

              <div className="hidden flex-col lg:flex">
                <span className="text-sm font-bold text-black dark:text-white lg:text-base">Trust by 10k+ users</span>
                <span className="text-xs font-medium text-black/40 dark:text-white/40 lg:text-sm">Global health network</span>
              </div>
            </div>
          </div>

          {/* Right Image Column - Refined with Overlays & Shadows */}
          <div className="relative mt-auto -mx-6 h-[50vh] overflow-visible lg:mt-0 lg:mx-0 lg:h-full lg:w-full">
            <div className="relative h-full w-full animate-fade-up [animation-delay:400ms]">

              {/* Background Glow Depth */}
              <div className="absolute top-1/2 left-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

              {/* Main Image with Soft Masking */}
              <div className="relative h-full w-full bg-transparent mask-soft-edge">
                <Image
                  src="/onboarding/patient.png"
                  alt="Patient in healthcare consultation"
                  fill
                  className="object-contain object-bottom scale-110 lg:scale-105 lg:object-bottom-right transition-transform duration-700 hover:scale-[1.1] cursor-pointer"
                  priority
                />
              </div>

              {/* Advanced Overlays to Hide Edges & Create Depth */}
              {/* 1. Bottom White Edge Fade */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white dark:from-[#0a0a0a] via-white/80 dark:via-[#0a0a0a]/80 to-transparent lg:h-48" />

              {/* 2. Side White Fades (Desktop Only) */}
              <div className="absolute inset-y-0 left-0 hidden w-32 bg-linear-to-r from-white dark:from-[#0a0a0a] to-transparent lg:block" />
              <div className="absolute inset-y-0 right-0 hidden w-48 bg-linear-to-l from-white dark:from-[#0a0a0a] to-transparent lg:block" />

              {/* 3. Radial Softening - Premium Feel */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,white_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_20%,#0a0a0a_100%)] opacity-100" />

              {/* 4. Top Soft Shadows for Texture */}
              <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-white dark:from-[#0a0a0a] to-transparent opacity-100" />
            </div>
          </div>
        </section>

        {/* Footer / Status Bar Indicator Simulation */}
        <footer className="mt-auto flex items-center justify-between font-outfit text-[10px] font-bold text-black/20 dark:text-white/20 lg:py-6 lg:text-sm">
          <div className="flex gap-2">
            <div className="h-1 w-8 rounded-full bg-black dark:bg-white lg:h-1.5 lg:w-16" />
            <div className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10 lg:h-1.5 lg:w-1.5" />
            <div className="h-1 w-1 rounded-full bg-black/10 dark:bg-white/10 lg:h-1.5 lg:w-1.5" />
          </div>
          <span className="uppercase tracking-[0.3em]">Precision Healthcare — v1.0</span>
        </footer>
      </div>
    </main>
  );
}