"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

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
        baseTheme: dark,
        variables: {
          colorPrimary: "#ff2a85",
          colorBackground: "#090816",
          colorText: "#ffffff",
          colorTextSecondary: "#a39ebf",
          colorInputBackground: "#121026",
          colorInputText: "#ffffff",
          borderRadius: "0px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
