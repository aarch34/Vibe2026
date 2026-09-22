"use server";

import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function sendConnectionRequestAction(receiverId: string) {
  const session = await getCurrentUserSession();
  return mockDb.sendConnectionRequest(session.profile.id, receiverId);
}

export async function respondConnectionRequestAction(requestId: string, action: "accept" | "decline") {
  const session = await getCurrentUserSession();
  if (action === "accept") {
    return mockDb.acceptConnectionRequest(requestId, session.profile.id);
  }
  return mockDb.declineConnectionRequest(requestId, session.profile.id);
}
