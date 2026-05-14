import type { Metadata, Viewport } from "next";
import { Syne, Inter, Outfit, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: false,
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-space-grotesk", // keeping variable name to avoid breaking tailwind config
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
  preload: false,
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hilium.ai'),
  title: {
    default: "Hilium | Your Intelligent Health Companion",
    template: "%s | Hilium",
  },
  description: "Health Intelligence Link Improving User Medications. Hilium is your next-generation healthcare assistant powered by advanced AI to help you track and optimize your health.",
  manifest: '/manifest.json?v=2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hilium',
    startupImage: '/icons/icon-512x512.png',
  },
  icons: {
    icon: [
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
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
import { PWAProvider } from "@/hooks/use-pwa";
import { CustomInstallPrompt } from "@/components/pwa/custom-install-prompt";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", interSans.variable)} suppressHydrationWarning>
      <body
        className={`${syne.variable} ${inter.variable} ${outfit.variable} ${bricolage.variable} antialiased min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <PWAProvider>
            <AuthProvider>
              <BackgroundGrid />

              {children}
              <Toaster closeButton position="top-center" expand visibleToasts={1} />
              <CustomInstallPrompt />
            </AuthProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
