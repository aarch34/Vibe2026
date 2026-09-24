import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";
import { FriendsClient } from "@/components/social/friends-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  const requests = await socialStore.getConnectionRequestsAsync(currentProfile.id);
  const friends = await socialStore.getConnectionsAsync(currentProfile.id);

  return (
    <FriendsClient
      currentProfile={currentProfile}
      incomingRequests={requests.incoming}
      outgoingRequests={requests.outgoing}
      initialFriends={friends}
    />
  );
}
