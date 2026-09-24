import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { VibeAuthProvider } from "@/components/auth/auth-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIBE 2026 | Rotaract Freshers Party",
  description: "Connect, play and experience VIBE before the big event. Meet people, share your moments, play games and earn XP.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "VIBE 2026 — Rotaract Freshers Party",
    description: "Connect, play and experience VIBE before the big event. Ride the wave, own the vibe.",
    images: [{ url: "/images/vibe-og.jpg", width: 1200, height: 630, alt: "VIBE 2026 Rotaract Freshers Party" }],
  },
  appleWebApp: {
    title: "VIBE 2026",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable} dark font-sans`} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-primary selection:text-primary-foreground font-sans">
        <VibeAuthProvider>{children}</VibeAuthProvider>
      </body>
    </html>
  );
}
