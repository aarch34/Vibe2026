import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { getAllDiscoverableProfiles } from "@/lib/db/profiles";
import { DiscoverClient } from "@/components/networking/discover-client";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;
  const initialProfiles = await getAllDiscoverableProfiles(currentProfile.id);
  const requests = mockDb.getConnectionRequests(currentProfile.id);

  return (
    <DiscoverClient
      currentProfile={currentProfile}
      initialProfiles={initialProfiles}
      incomingRequests={requests.incoming}
    />
  );
}
