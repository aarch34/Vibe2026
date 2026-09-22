"use server";

import { mockDb } from "@/lib/db/mock-store";

export async function adminAdjustXpAction(targetUserId: string, amount: number, reason: string, adminName: string) {
  return mockDb.adminAdjustXp(targetUserId, "admin", adminName, amount, reason);
}
