import Link from "next/link";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Coins, Sparkles, Trophy, Compass, ArrowRight, Waves, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getCurrentUserSession();

  // Resolve assigned zone name
  let assignedZoneName: string | null = null;
  if (session.profile.assigned_zone_id) {
    const memZone = mockDb.zones.get(session.profile.assigned_zone_id);
    if (memZone) {
      assignedZoneName = memZone.name;
    } else if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: z } = await supabaseAdmin
          .from("zones")
          .select("name")
          .eq("id", session.profile.assigned_zone_id)
          .maybeSingle();
        if (z) assignedZoneName = z.name;
      } catch {}
    }
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Animated Celebration Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-card border-2 border-border text-foreground text-xs font-black shadow-[2px_2px_0px_var(--border)] animate-pulse">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Rotaract District 3192 Presents</span>
        </div>

        {/* Big Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground uppercase">
            WELCOME TO VIBE
          </h1>
          <div className="inline-block px-4 py-1.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)]">
            <p className="text-sm sm:text-base font-black flex items-center justify-center space-x-2">
              {assignedZoneName ? (
                <>
                  <span>You are part of</span>
                  <span className="underline decoration-2 underline-offset-4">
                    🌊 {assignedZoneName.toUpperCase()}
                  </span>
                </>
              ) : (
                <span>🌊 6 Oceanic Zones Await You</span>
              )}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-bold">
            {assignedZoneName
              ? "Your VIBE journey starts now."
              : "Choose your oceanic zone from the Home feed and lead them to victory!"}
          </p>
        </div>

        {/* Coin Drop Visual Presentation */}
        <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
          <div className="w-16 h-16 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] mx-auto flex items-center justify-center animate-bounce">
            <Coins className="w-8 h-8 text-foreground" />
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-black font-mono text-foreground tracking-tight block">
              🪙 +500 VIBE
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Starting Coin Wallet Credited
            </span>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-3 border-t-2 border-border text-xs font-mono font-bold">
            <div className="flex items-center space-x-1.5 text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>⭐ 0 XP</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center space-x-1.5 text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Level 1 VIBE Newbie</span>
            </div>
          </div>
        </div>

        {/* Mission Briefing */}
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo text-left space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-foreground uppercase tracking-wider">
            <Compass className="w-4 h-4 text-primary" />
            <span>Your Festival Mission</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Explore VIBE, complete experiences, interact with stalls, play games and help your zone climb to the top of the VIBE Zone Battle!
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href="/app"
            className="neo-btn-primary w-full py-4 text-base font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <span>ENTER VIBE</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
