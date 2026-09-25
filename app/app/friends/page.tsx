import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";
import { FriendsClient } from "@/components/social/friends-client";

export const dynamic = "force-dynamic";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  const requests = await socialStore.getConnectionRequestsAsync(currentProfile.id);
  const friends = await socialStore.getConnectionsAsync(currentProfile.id);

  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const rawTab = resolvedParams?.tab;
  const defaultTab =
    rawTab === "sent" ? "sent" : rawTab === "requests" ? "requests" : rawTab === "friends" ? "friends" : undefined;

  return (
    <FriendsClient
      currentProfile={currentProfile}
      incomingRequests={requests.incoming}
      outgoingRequests={requests.outgoing}
      initialFriends={friends}
      defaultTab={defaultTab}
    />
  );
}
