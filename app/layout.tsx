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
  metadataBase: new URL('https://hilium.ai'),
  title: {
    default: "Hilium | Your Intelligent Health Companion",
    template: "%s | Hilium",
  },
  description: "Hilium is your next-generation healthcare assistant. Powered by advanced artificial intelligence to help you track, optimize, and secure your health data seamlessly.",
  keywords: ["healthcare AI", "medical assistant", "AI doctor", "personal health record", "symptom checker", "Hilium", "AI in healthcare", "telemedicine", "medical tracking"],
  authors: [{ name: "Hilium Team" }],
  creator: "Hilium",
  publisher: "Hilium",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hilium.ai",
    siteName: "Hilium",
    title: "Hilium | Your Intelligent Health Companion",
    description: "Hilium is your next-generation healthcare assistant. Powered by advanced artificial intelligence to help you track, optimize, and secure your health data seamlessly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hilium - Intelligent Health Companion Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hilium | Your Intelligent Health Companion",
    description: "Experience the next generation healthcare assistant. Track and manage your health precisely with Hilium.",
    images: ["/og-image.png"],
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
    canonical: "https://hilium.ai",
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
            {/* Header / Logo */}
            <header className="mb-6 lg:mb-12 animate-slide-right">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black shadow-2xl lg:h-14 lg:w-14 overflow-hidden">
                   <img src="/hilium.png" alt="Hilium Logo" className="w-full h-full object-cover p-1" />
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit text-lg font-bold tracking-tight lg:text-2xl leading-none text-black">Hilium</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 lg:text-xs">Intelligence</span>
                </div>
              </div>
            </header>
            {children}
            <Toaster closeButton position="top-center" expand visibleToasts={1} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
