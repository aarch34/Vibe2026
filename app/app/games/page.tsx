import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { GamesHub } from "@/components/games/games-hub";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  return <GamesHub currentProfileId={currentProfile.id} />;
}
