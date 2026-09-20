"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkReady = publishableKey && !publishableKey.includes("placeholder");

export function VibeAuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkReady) {
    return <>{children}</>;
  }

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
