"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Waves,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
  Compass,
} from "lucide-react";
import { selectMyZoneAction } from "@/actions/profile/update-profile";

const OFFICIAL_ZONES = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    slug: "arnava",
    name: "Arnava",
    tagline: "The Ocean of Momentum",
    icon: "🌊",
    accent: "#0284C7",
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    slug: "taranaga",
    name: "Taranaga",
    tagline: "The Rhythm of the Tide",
    icon: "🌊",
    accent: "#EC4899",
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    slug: "sagara",
    name: "Sagara",
    tagline: "The Deep Collective",
    icon: "🌊",
    accent: "#00D2FF",
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    slug: "pravaha",
    name: "Pravaha",
    tagline: "The Relentless Current",
    icon: "🌊",
    accent: "#10B981",
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    slug: "samudhra",
    name: "Samudhra",
    tagline: "The Endless Horizon",
    icon: "🌊",
    accent: "#F59E0B",
  },
  {
    id: "d0000000-0000-0000-0000-000000000006",
    slug: "varuna",
    name: "Varuna",
    tagline: "The Cosmic Sovereign",
    icon: "🌊",
    accent: "#8B5CF6",
  },
];

interface ZoneSelectionBannerProps {
  currentAssignedZoneId?: string | null;
  currentZoneName?: string;
  isUnassigned?: boolean;
}

export function ZoneSelectionBanner({
  currentAssignedZoneId,
  currentZoneName,
  isUnassigned = false,
}: ZoneSelectionBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectZone = (zoneId: string, zoneName: string) => {
    setSelectedZoneId(zoneId);
    setFeedback(`Assigning you to Zone ${zoneName}...`);

    startTransition(async () => {
      const res = await selectMyZoneAction(zoneId);
      if (res.success) {
        setFeedback(`Welcome to Zone ${zoneName}! 🎉`);
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
          setSelectedZoneId(null);
          router.refresh();
        }, 700);
      } else {
        setFeedback(res.message || "Failed to assign zone.");
        setSelectedZoneId(null);
      }
    });
  };

  // If attendee has no zone assigned, show prominent banner
  if (isUnassigned) {
    return (
      <div className="p-4 sm:p-5 bg-card text-card-foreground border-4 border-primary shadow-neo space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center text-xl shrink-0">
              🌊
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground font-mono">
                  ACTION REQUIRED
                </span>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  Festival House Selection
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight font-mono mt-0.5">
                Select Your Official Oceanic Zone
              </h2>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Choose the oceanic zone you will represent in the live 6-zone championship battle! All coins you spend at game stalls and stages will boost your chosen zone's ranking.
        </p>

        {feedback && (
          <div className="p-2.5 bg-primary/20 border border-primary text-xs font-bold text-primary flex items-center space-x-2">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {OFFICIAL_ZONES.map((zone) => {
            const isLoading = isPending && selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                disabled={isPending}
                onClick={() => handleSelectZone(zone.id, zone.name)}
                className="p-3 bg-muted hover:bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{zone.icon}</span>
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-primary group-hover:underline">
                      Join →
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-mono font-black text-xs uppercase text-foreground">
                    {zone.name}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">
                    {zone.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // If already assigned, provide a modal trigger so they can switch zones
  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-card border border-border px-2 py-0.5 shadow-[1px_1px_0px_var(--border)] transition-all cursor-pointer"
        title="Switch your festival zone"
      >
        <span>Change</span>
        <span>⇄</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-card text-card-foreground border-4 border-border shadow-neo-lg p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-border">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🌊</span>
                <div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight font-mono">
                    Select Your Oceanic Zone
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    Currently representing: <strong>{currentZoneName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-muted text-muted-foreground hover:text-foreground border-2 border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div className="p-2.5 bg-primary/20 border border-primary text-xs font-bold text-primary flex items-center space-x-2">
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{feedback}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OFFICIAL_ZONES.map((zone) => {
                const isCurrent =
                  currentAssignedZoneId === zone.id ||
                  currentAssignedZoneId === zone.slug ||
                  `z-${zone.slug}` === currentAssignedZoneId;
                const isLoading = isPending && selectedZoneId === zone.id;

                return (
                  <button
                    key={zone.id}
                    type="button"
                    disabled={isPending || isCurrent}
                    onClick={() => handleSelectZone(zone.id, zone.name)}
                    className={`p-3 text-left border-2 transition-all flex flex-col justify-between ${
                      isCurrent
                        ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)] font-black"
                        : "bg-muted text-foreground border-border hover:bg-card active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{zone.icon}</span>
                      {isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-secondary-foreground" />
                      ) : isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <div className="font-mono font-black text-xs uppercase">
                        {zone.name}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">
                        {isCurrent ? "Active Zone" : zone.tagline}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t-2 border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-black bg-muted text-foreground border-2 border-border font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
