import { Metadata } from "next";
import { getFriendsDataAction } from "@/actions/social/friends";
import { FriendsClient } from "@/components/social/friends-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friends & Instagram Networking | ROCCO 2026",
  description: "Connect with fellow freshers on Instagram, become in-app friends, and earn +25 XP per friend.",
};

export default async function FriendsPage() {
  const data = await getFriendsDataAction();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <FriendsClient
        initialFriends={data.friends}
        allAttendees={data.allAttendees}
        totalXpEarned={data.totalXpEarned}
      />
    </div>
  );
}
