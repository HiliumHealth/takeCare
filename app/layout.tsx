import type { Metadata } from "next";
import { Syne, Inter, Outfit, Geist, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-space-grotesk", // keeping variable name to avoid breaking tailwind config
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://takecare-ai.vercel.app'),
  title: {
    default: "TakeCare AI | Your Intelligent Health Companion",
    template: "%s | TakeCare AI",
  },
  description: "TakeCare AI is your next-generation healthcare assistant. Powered by advanced artificial intelligence to help you track, optimize, and secure your health data seamlessly.",
  keywords: ["healthcare AI", "medical assistant", "AI doctor", "personal health record", "symptom checker", "TakeCare AI", "AI in healthcare", "telemedicine", "medical tracking"],
  authors: [{ name: "TakeCare AI Team" }],
  creator: "TakeCare AI",
  publisher: "TakeCare AI",
  openGraph: {
    title: "TakeCare AI | Your Intelligent Health Companion",
    description: "TakeCare AI is your next-generation healthcare assistant. Powered by advanced artificial intelligence to help you track, optimize, and secure your health data seamlessly.",
    url: "https://takecare-ai.vercel.app",
    siteName: "TakeCare AI",
    images: [
      {
        url: "https://i.ibb.co/LXwrFDNT/patient-black-female-removebg-1773219328794.png",
        width: 1200,
        height: 630,
        alt: "TakeCare AI - Intelligent Health Companion Interface",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TakeCare AI | Your Intelligent Health Companion",
    description: "Experience the next generation healthcare assistant. Track and manage your health precisely with TakeCare AI.",
    images: ["https://i.ibb.co/LXwrFDNT/patient-black-female-removebg-1773219328794.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://takecare-ai.vercel.app",
  },
};

import { BackgroundGrid } from "@/components/ui/background-grid";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className={`${syne.variable} ${inter.variable} ${outfit.variable} ${bricolage.variable} antialiased min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <BackgroundGrid />
            {children}
            <Toaster closeButton position="top-center" expand visibleToasts={1} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
