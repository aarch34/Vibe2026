import { mockDb } from "@/lib/db/mock-store";

export async function getWalletSummary(eventId: string, profileId: string) {
  const profile = mockDb.getProfile(profileId);
  return {
    wallet: { balance: profile?.xp || 0 },
    transactions: [],
  };
}

export function formatCoins(coins: number): string {
  return `${coins} XP`;
}
