import React from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Sparkles, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export const metadata = {
  title: "Sign In • VIBE 2026",
  description: "Sign in to your VIBE 2026 attendee or staff account.",
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkReady =
  publishableKey &&
  !publishableKey.includes("placeholder") &&
  Boolean(process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.includes("placeholder"));

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 selection:bg-primary selection:text-primary-foreground">
      {/* Brand Header */}
      <div className="w-full max-w-md mb-6 text-center space-y-2">
        <Link href="/" className="inline-flex items-center space-x-2 group">
          <span className="text-3xl font-mono font-black tracking-wider text-foreground group-hover:text-primary transition-colors">
            VIBE
          </span>
          <span className="text-xs uppercase tracking-widest font-black px-2 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-neo">
            '26
          </span>
        </Link>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Rotaract District 3192 Freshers Party
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md">
        {isClerkReady ? (
          <div className="flex justify-center">
            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-card text-card-foreground border-2 border-border shadow-neo rounded-none p-6",
                  headerTitle: "font-mono font-black text-foreground uppercase tracking-wide text-lg",
                  headerSubtitle: "text-muted-foreground font-medium text-xs",
                  formButtonPrimary:
                    "bg-primary text-primary-foreground font-black uppercase tracking-wider text-xs py-3 border-2 border-border rounded-none shadow-[2px_2px_0px_var(--border)] hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px]",
                  formFieldInput:
                    "bg-background text-foreground border-2 border-border rounded-none font-medium focus:ring-0 focus:border-primary px-3 py-2.5 text-sm",
                  formFieldLabel: "text-xs font-bold uppercase tracking-wider text-foreground",
                  footerActionLink: "text-primary font-black hover:underline",
                  dividerLine: "bg-border",
                  dividerText: "text-xs font-mono uppercase text-muted-foreground",
                },
              }}
            />
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-card text-card-foreground border-2 border-border shadow-neo space-y-5">
            <div className="flex items-center space-x-3 text-secondary">
              <KeyRound className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">
                  Clerk Authentication Ready
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Authentication is wired with Clerk integration.
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/60 border-2 border-border text-xs space-y-2">
              <p className="font-bold text-foreground">
                To sign in with real Clerk accounts:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Add your real <code className="bg-background px-1 py-0.5 border border-border font-mono text-[11px]">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code className="bg-background px-1 py-0.5 border border-border font-mono text-[11px]">CLERK_SECRET_KEY</code> to <code className="bg-background px-1 py-0.5 border border-border font-mono text-[11px]">.env.local</code>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/app"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider border-2 border-border shadow-neo hover:brightness-105 transition-all"
              >
                <span>Enter Attendee Portal (Dev Mode)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-secondary text-secondary-foreground font-black text-xs uppercase tracking-wider border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-105 transition-all"
              >
                <span>Register New Attendee</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="mt-8 text-center text-xs font-bold text-muted-foreground space-x-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>•</span>
        <Link href="/register" className="hover:text-foreground transition-colors">
          Register
        </Link>
        <span>•</span>
        <Link href="/staff/login" className="hover:text-foreground transition-colors">
          Staff Station
        </Link>
        <span>•</span>
        <Link href="/admin/login" className="hover:text-foreground transition-colors">
          Admin Portal
        </Link>
      </div>
    </div>
  );
}
