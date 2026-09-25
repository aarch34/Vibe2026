"use server";

import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";

export async function sendConnectionRequestAction(receiverId: string) {
  const session = await getCurrentUserSession();
  return mockDb.sendConnectionRequest(session.profile.id, receiverId);
}

export async function respondConnectionRequestAction(requestId: string, action: "accept" | "decline") {
  const session = await getCurrentUserSession();
  const res = await socialStore.respondConnectionRequest(
    requestId,
    session.profile.id,
    action,
    session.profile.display_name
  );
  invalidateSessionCache(session.clerkUserId);
  invalidateSessionCache(session.profile.id);
  if ((res as any).senderId) {
    invalidateSessionCache((res as any).senderId);
  }
  return res;
}
