import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { ProfileView } from "@/components/profile/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  const targetId = searchParams?.id || currentProfile.id;
  const targetProfile = mockDb.getProfile(targetId) || currentProfile;
  const isSelf = targetId === currentProfile.id;

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
