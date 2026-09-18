import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { StallVerificationQueue } from "@/components/staff/stall-verification-queue";

export const dynamic = "force-dynamic";

export default async function StaffStallsPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let submissions: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: subs } = await supabaseAdmin
      .from("stall_photos")
      .select("*, stalls(name), profiles(display_name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    submissions = (subs || []).map((s: any) => ({
      ...s,
      attendeeName: s.profiles?.display_name || "Attendee",
      stallName: s.stalls?.name || "Stall",
    }));
  }

  if (!submissions || submissions.length === 0) {
    submissions = mockDb.stallPhotoSubmissions.map((s) => ({
      ...s,
      attendeeName: mockDb.profiles.get(s.profile_id)?.display_name || "Attendee",
      stallName: mockDb.stalls.get(s.stall_id)?.name || "Stall",
    }));
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <StallVerificationQueue initialSubmissions={submissions} />
    </div>
  );
}
