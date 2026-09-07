"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Shield, QrCode, ArrowRightLeft, Sparkles, ChevronDown } from "lucide-react";

interface TestSwitcherProps {
  currentVibeId: string;
  currentDisplayName: string;
}

const TEST_ATTENDEES = [
  { id: "usr-demo-1", name: "Aarav Sharma", vibeId: "VIBE-2412", role: "Attendee" },
  { id: "usr-demo-2", name: "Rhea Kapoor", vibeId: "VIBE-5821", role: "Attendee" },
  { id: "usr-demo-3", name: "Kabir Mehta", vibeId: "VIBE-8934", role: "Attendee" },
  { id: "usr-demo-4", name: "Ananya Roy", vibeId: "VIBE-1245", role: "Attendee" },
];

export function TestSwitcher({ currentVibeId, currentDisplayName }: TestSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSwitchUser(userId: string) {
    setIsLoading(true);
    try {
      await fetch("/api/auth/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full bg-slate-950/90 border-b border-slate-800/80 px-3 py-1.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400">Testing Mode:</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 font-bold text-white hover:text-cyan-300 transition-colors bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded"
          >
            <span>{currentDisplayName}</span>
            <span className="text-[10px] text-cyan-400 font-mono">({currentVibeId})</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <a
            href="/staff"
            className="text-slate-400 hover:text-amber-400 font-medium transition-colors"
          >
            Staff
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/admin"
            className="text-slate-400 hover:text-blue-400 font-medium transition-colors"
          >
            Admin
          </a>
        </div>
      </div>

      {isOpen && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Switch Test Attendee (Real Supabase Profiles):
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TEST_ATTENDEES.map((att) => {
              const isCurrent = att.vibeId === currentVibeId;
              return (
                <button
                  key={att.id}
                  disabled={isLoading || isCurrent}
                  onClick={() => handleSwitchUser(att.id)}
                  className={`p-2 rounded-lg text-left text-xs transition-all border ${
                    isCurrent
                      ? "bg-blue-600/20 border-blue-500/50 text-white font-bold"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{att.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-blue-500 text-white px-1 rounded font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {att.vibeId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
