import React from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { LogIn, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Sign In • VIBE 2026",
  description: "Sign in to your VIBE 2026 attendee account.",
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
            ROCCO
          </span>
          <span className="text-xs uppercase tracking-widest font-black px-2 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-neo">
            VIBE '26
          </span>
        </Link>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Sign In to Your Attendee Account
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
              forceRedirectUrl="/register"
              fallbackRedirectUrl="/app"
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
            <div className="flex items-center space-x-3 text-primary">
              <LogIn className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">
                  Attendee Sign In
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Log in to access your VIBE passport and activities.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/sign-up"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider border-2 border-border shadow-neo hover:brightness-105 transition-all"
              >
                <span>Create New Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-card text-card-foreground font-black text-xs uppercase tracking-wider border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-muted transition-all"
              >
                <span>Continue Registration</span>
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
        <Link href="/sign-up" className="hover:text-foreground transition-colors">
          Sign Up
        </Link>
        <span>•</span>
        <Link href="/register" className="hover:text-foreground transition-colors">
          Festival Register
        </Link>
      </div>
    </div>
  );
}
