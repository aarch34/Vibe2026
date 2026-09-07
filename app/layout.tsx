import type { Metadata, Viewport } from "next";
import "./globals.css";
import { VibeAuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "VIBE 2026 — Rotaract District 3192 Freshers Party",
  description: "Gamified mobile-first physical event platform. Explore zones, scan QR codes, unlock experiences, earn coins, and conquer the leaderboard!",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070B14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070B14] text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        <VibeAuthProvider>{children}</VibeAuthProvider>
      </body>
    </html>
  );
}
