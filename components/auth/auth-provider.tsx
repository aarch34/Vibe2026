"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

// Production Clerk Publishable Key for ROCCO/VIBE 2026
const DEFAULT_CLERK_PUBLISHABLE_KEY =
  "pk_test_dG9wLXB5dGhvbi05MDg5LmNsZXJrLmFjY291bnRzLmRldiQ";

export function VibeAuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/app"
      afterSignUpUrl="/app"
      appearance={{
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#09090b",
          colorText: "#f4f4f5",
          colorInputBackground: "#18181b",
          colorInputText: "#fafafa",
          borderRadius: "0px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
