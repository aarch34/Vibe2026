import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RegisterClient } from "@/components/auth/register-client";
import { getCurrentUserSession } from "@/lib/auth/session";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register & Onboarding • VIBE 2026",
  description:
    "Create your profile, connect with attendees, play games, and earn XP for VIBE 2026.",
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkConfigured =
  publishableKey &&
  !publishableKey.includes("placeholder") &&
  Boolean(process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.includes("placeholder"));

export default async function RegisterPage() {
  let clerkUserId: string | null = null;
  let fullName = "";
  let email = "";
  let avatarUrl = "";

  if (isClerkConfigured) {
    try {
      const authData = auth();
      clerkUserId = authData.userId;
      if (!clerkUserId) {
        redirect("/sign-up?redirect_url=/register");
      }

      // Check if user has already completed registration in Supabase
      let isAlreadyRegistered = false;
      if (isUsingLiveSupabase() && supabaseAdmin) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, profile_completed, club, phone")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();

        if (existingProfile && (existingProfile.profile_completed || (existingProfile.club && existingProfile.phone))) {
          isAlreadyRegistered = true;
        }
      }

      if (isAlreadyRegistered) {
        redirect("/app");
      }

      const user = await currentUser();
      if (user) {
        fullName = user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.username || "";
        email = user.emailAddresses?.[0]?.emailAddress || "";
        avatarUrl = user.imageUrl || "";
      }
    } catch (err: any) {
      if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith?.("NEXT_REDIRECT")) {
        throw err;
      }
      console.warn("Clerk user resolution on /register:", err);
    }
  } else {
    // Non-Clerk fallback
    try {
      const session = await getCurrentUserSession();
      if (
        session?.profile?.profile_completed &&
        session.profile.display_name !== "VIBE Member" &&
        session.profile.display_name !== "VIBE Attendee"
      ) {
        redirect("/app");
      }
    } catch {
      // allow onboarding
    }
  }

  return (
    <RegisterClient
      initialData={{
        clerkUserId: clerkUserId || undefined,
        fullName,
        email,
        avatarUrl,
      }}
    />
  );
}
