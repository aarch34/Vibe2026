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
  title: "ROCCO '26 | VIBE 2026",
  description: "Connect, play and experience VIBE before the big event. Meet people, share your moments, play games and earn XP.",
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
