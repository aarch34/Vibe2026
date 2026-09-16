import Link from "next/link";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Coins, Sparkles, Trophy, Compass, ArrowRight, Waves, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getCurrentUserSession();

  // Resolve assigned zone name
  let assignedZoneName = "Arnava";
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
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-cyan-300 text-xs font-semibold shadow-lg shadow-blue-500/20 animate-pulse">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Rotaract District 3192 Presents</span>
        </div>

        {/* Big Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
            WELCOME TO VIBE
          </h1>
          <div className="inline-block px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-blue-950 border border-blue-400/40 shadow-md">
            <p className="text-sm sm:text-base font-extrabold text-white flex items-center justify-center space-x-2">
              <span>You are part of</span>
              <span className="text-cyan-300 font-black underline decoration-cyan-400 underline-offset-4">
                🌊 {assignedZoneName.toUpperCase()}
              </span>
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your VIBE journey starts now.
          </p>
        </div>

        {/* Coin Drop Visual Presentation */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 mx-auto shadow-lg shadow-amber-500/40 animate-bounce">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <Coins className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight block">
              🪙 +500 VIBE
            </span>
            <span className="text-xs font-bold text-amber-300/90 uppercase tracking-wider">
              Starting Coin Wallet Credited
            </span>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-2 border-t border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>⭐ 0 XP</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center space-x-1.5 text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Level 1 VIBE Newbie</span>
            </div>
          </div>
        </div>

        {/* Mission Briefing */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Your Festival Mission</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Explore VIBE, complete experiences, interact with stalls, play games and help your zone climb to the top of the VIBE Zone Battle!
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href="/app"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-cyan-400 active:scale-95 text-base font-black text-white shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>ENTER VIBE</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
