import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { StallsClient } from "@/components/stalls/stalls-client";
import { Camera, Sparkles, ShieldCheck } from "lucide-react";
import { Stall, StallPhotoSubmission } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StallsPage() {
  const session = await getCurrentUserSession();

  let stalls: Stall[] = [];
  let userSubmissions: StallPhotoSubmission[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [stallsRes, subsRes] = await Promise.all([
      supabaseAdmin
        .from("stalls")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("is_active", true),
      supabaseAdmin
        .from("stall_photos")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id),
    ]);

    stalls = stallsRes.data || [];
    userSubmissions = subsRes.data || [];
  }

  if (!stalls || stalls.length === 0) {
    stalls = Array.from(mockDb.stalls.values()).filter((s) => s.is_active);
    userSubmissions = mockDb.stallPhotoSubmissions.filter(
      (p) => p.profile_id === session.profile.id && p.event_id === session.eventId
    );
  }

  const approvedCount = userSubmissions.filter((s) => s.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight font-mono">
              Event Stalls & Photo Checkpoints
            </h1>
            <p className="text-xs text-muted-foreground font-bold">
              Visit stalls, snap photos with your handle, and earn ⭐ +100 XP & 🪙 +25 VIBE!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-3 py-1.5 self-start sm:self-auto">
          <span className="text-[11px] uppercase font-black text-muted-foreground font-mono">
            Verified Stalls:
          </span>
          <span className="text-xs font-mono font-black text-primary">
            {approvedCount} / {stalls.length}
          </span>
        </div>
      </div>

      {/* Client Component with Photo Uploader & Status Tracking */}
      <StallsClient
        stalls={stalls}
        initialSubmissions={userSubmissions}
        userInstagramId={session.profile.instagram_id || `@${session.profile.display_name.toLowerCase().replace(/\s+/g, ".")}`}
      />
    </div>
  );
}
