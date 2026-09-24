import React from "react";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { getProfileByIdOrClerkId } from "@/lib/db/profiles";
import { ProfileView } from "@/components/profile/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  const targetId = searchParams?.id;
  const isSelf = !targetId || targetId === currentProfile.id;

  let targetProfile = currentProfile;
  if (!isSelf && targetId) {
    const fetched = await getProfileByIdOrClerkId(targetId);
    if (!fetched) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center text-muted-foreground">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black uppercase text-foreground">
              Profile Not Found
            </h1>
            <p className="text-xs text-muted-foreground max-w-sm">
              We couldn't locate this attendee's profile. They may have updated their profile or the link might be incorrect.
            </p>
          </div>
          <Link
            href="/app/discover"
            className="neo-btn-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Discover Other Attendees</span>
          </Link>
        </div>
      );
    }
    targetProfile = fetched;
  }

  const userPosts = mockDb.getPosts().filter((p) => p.author_id === targetProfile.id);
  const highScores = mockDb.getGameHighScores(targetProfile.id);

  return (
    <ProfileView
      profile={targetProfile}
      isSelf={isSelf}
      userPosts={userPosts}
      highScores={highScores}
    />
  );
}
