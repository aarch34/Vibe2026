import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { RegisterClient } from "@/components/auth/register-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register & Festival Onboarding • VIBE 2026",
  description:
    "Claim 500 VIBE coins, choose your oceanic zone, and enter the Rotaract District 3192 festival.",
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
