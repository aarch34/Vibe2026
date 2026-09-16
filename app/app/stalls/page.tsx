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
  } else {
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
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Event Stalls & Photo Checkpoints
            </h1>
            <p className="text-xs text-slate-400">
              Visit stalls, snap photos with your handle, and earn ⭐ +100 XP & 🪙 +25 VIBE!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="text-[11px] uppercase font-bold text-slate-400">
            Verified Stalls:
          </span>
          <span className="text-xs font-mono font-black text-cyan-400">
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
