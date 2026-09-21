import { RegisterClient } from "@/components/auth/register-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register & Festival Onboarding • VIBE 2026",
  description:
    "Claim 500 VIBE coins, choose your oceanic zone, and enter the Rotaract District 3192 festival.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
