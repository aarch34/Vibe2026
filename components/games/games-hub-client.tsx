"use client";

import { GamesHub } from "./games-hub";
import { Profile } from "@/types/database";

export function GamesHubClient({ currentProfile, initialSummary }: { currentProfile: Profile; initialSummary: any }) {
  return <GamesHub currentProfile={currentProfile} initialSummary={initialSummary} />;
}
