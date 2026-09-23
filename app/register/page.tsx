import { redirect } from "next/navigation";
import { RegisterClient } from "@/components/auth/register-client";
import { getCurrentUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register & Onboarding • VIBE 2026",
  description:
    "Create your profile, connect with attendees, play games, and earn XP for VIBE 2026.",
};

export default async function RegisterPage() {
  let session = null;
  try {
    session = await getCurrentUserSession();
  } catch {
    // If unauthenticated, Clerk middleware or page allows registration onboarding
  }

  if (
    session?.profile?.profile_completed &&
    session.profile.display_name !== "VIBE Member" &&
    session.profile.display_name !== "VIBE Attendee"
  ) {
    redirect("/app");
  }

  return <RegisterClient />;
}
