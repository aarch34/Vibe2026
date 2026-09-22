"use client";

import { GamesHub } from "./games-hub";

export function GamesHubClient({ currentProfileId }: { currentProfileId: string }) {
  return <GamesHub currentProfileId={currentProfileId} />;
}
