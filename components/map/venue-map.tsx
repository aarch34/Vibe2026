"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  CheckCircle2,
  Lock,
  QrCode,
  Sparkles,
  Trophy,
  X,
  ChevronRight,
  Flame,
  Waves,
} from "lucide-react";
import { Zone, Experience, ExperienceCompletion } from "@/types/database";

interface VenueMapProps {
  zones: Zone[];
  experiences: Experience[];
  userCompletions: ExperienceCompletion[];
  assignedZoneId?: string | null;
}

const ZONE_TAGLINES: Record<string, string> = {
  arnava: "Rising Tide",
  taranaga: "Electric Ripple",
  sagara: "Deep Ocean",
  pravaha: "Relentless Flow",
  samudhra: "Endless Horizon",
  varuna: "Ocean Sovereign",
};

function getZoneTagline(zone: Zone): string {
  const slugKey = (zone.slug || zone.name || "").replace(/^z-/, "").toLowerCase();
  return zone.tagline || ZONE_TAGLINES[slugKey] || "Oceanic Zone";
}

export function VenueMap({
  zones,
  experiences,
  userCompletions,
  assignedZoneId,
}: VenueMapProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const completedExpIds = new Set(userCompletions.map((c) => c.experience_id));

  function isAssignedZone(zone: Zone | null | undefined): boolean {
    if (!zone || !assignedZoneId) return false;
    if (assignedZoneId === zone.id) return true;
    if (zone.slug) {
      if (assignedZoneId === zone.slug) return true;
      if (assignedZoneId === `z-${zone.slug}`) return true;
      if (
        assignedZoneId.replace(/^z-/, "").toLowerCase() ===
        zone.slug.replace(/^z-/, "").toLowerCase()
      )
        return true;
    }
    if (zone.name) {
      if (assignedZoneId.toLowerCase() === zone.name.toLowerCase()) return true;
      if (
        assignedZoneId.replace(/^z-/, "").toLowerCase() ===
        zone.name.toLowerCase()
      )
        return true;
    }
    return false;
  }

  // Determine state of each zone
  function getZoneStatus(zoneId: string) {
    const zoneExps = experiences.filter((e) => e.zone_id === zoneId);
    if (zoneExps.length === 0) return "available";

    const completedInZone = zoneExps.filter((e) => completedExpIds.has(e.id));
    if (completedInZone.length === zoneExps.length && zoneExps.length > 0)
      return "completed";
    if (completedInZone.length > 0) return "in_progress";
    return "available";
  }

  const selectedZoneExperiences = selectedZone
    ? experiences.filter((e) => e.zone_id === selectedZone.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Venue Map Container (Left on PC) */}
      <div className="lg:col-span-7 space-y-2">
        <div className="relative w-full aspect-[4/4] sm:aspect-[4/3.6] lg:aspect-auto lg:h-[560px] bg-gradient-to-b from-[#090816] via-[#120E26] to-[#090816] border-2 border-border shadow-neo p-3 overflow-hidden flex flex-col justify-between rounded-none">
          {/* Header overlay */}
          <div className="flex items-center justify-between z-10 px-2 pt-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-accent rounded-full animate-ping" />
              <span className="text-[11px] font-mono font-black text-foreground tracking-wider uppercase">
                Interactive Zone Radar
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-card/80 px-2 py-0.5 border border-border">
              Tap any zone to explore
            </span>
          </div>

          {/* SVG Venue Grid & Connecting Pathways */}
          <svg
            viewBox="0 0 400 420"
            className="w-full h-full my-auto"
            style={{ touchAction: "manipulation" }}
          >
            <defs>
              <radialGradient id="venueGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9333EA" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#00D2FF" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#090816" stopOpacity="0" />
              </radialGradient>
              <linearGradient
                id="pathGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FF2A85" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.6" />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Ambient Glow */}
            <rect width="400" height="420" fill="url(#venueGlow)" />

            {/* Circular Radar Grid Rings */}
            <circle
              cx="200"
              cy="200"
              r="160"
              fill="none"
              stroke="#2E2854"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
            <circle
              cx="200"
              cy="200"
              r="105"
              fill="none"
              stroke="#2E2854"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <circle
              cx="200"
              cy="200"
              r="50"
              fill="none"
              stroke="#3B336A"
              strokeWidth="1"
            />

            {/* Connecting Pathway Lines */}
            <path
              d="M 120 90 L 200 180 L 280 90 M 120 90 L 90 250 L 130 330 L 200 180 M 280 90 L 310 250 L 270 330 L 200 180 M 130 330 L 270 330"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="animate-pulse"
            />

            {/* Central Sagara / Arena Marker */}
            <circle
              cx="200"
              cy="180"
              r="46"
              fill="#141130"
              stroke="#A855F7"
              strokeWidth="2"
              strokeOpacity="0.8"
            />

            {/* Interactive Zone Nodes */}
            {zones.map((zone) => {
              const status = getZoneStatus(zone.id);
              const x = zone.map_data?.x || 200;
              const y = zone.map_data?.y || 200;
              const isSelected = selectedZone?.id === zone.id;
              const isUserZone = isAssignedZone(zone);

              let strokeColor = "#00D2FF"; // Neon Blue/Cyan default
              let fillColor = "#141130";

              if (status === "completed") {
                strokeColor = "#10B981"; // Emerald
                fillColor = "#064E3B";
              } else if (status === "in_progress") {
                strokeColor = "#FF2A85"; // Neon Pink
                fillColor = "#4A0E2E";
              }

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer transition-transform duration-200 group"
                  onClick={() => setSelectedZone(zone)}
                >
                  {/* Outer halo when user's assigned zone */}
                  {isUserZone && (
                    <circle
                      cx={x}
                      cy={y}
                      r="33"
                      fill="none"
                      stroke="#FF2A85"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: "10s" }}
                    />
                  )}

                  {/* Outer halo when selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="37"
                      fill="none"
                      stroke="#00D2FF"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="27"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? "3.5" : "2"}
                    filter={isSelected ? "url(#neonGlow)" : undefined}
                    className="transition-all hover:scale-110 active:scale-95"
                  />

                  {/* Zone Number */}
                  <text
                    x={x}
                    y={y - 3}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    Z{zone.sort_order}
                  </text>

                  {/* Zone Name Label */}
                  <text
                    x={x}
                    y={y + 11}
                    textAnchor="middle"
                    fill={status === "completed" ? "#34D399" : "#00D2FF"}
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {zone.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Status Legend */}
          <div className="bg-card/90 backdrop-blur-md border-2 border-border shadow-[2px_2px_0px_var(--border)] py-2 px-3 flex items-center justify-around text-[10px] font-black text-foreground font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#10B981] border border-border" />
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#FF2A85] border border-border" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#00D2FF] border border-border" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[#FF2A85] text-xs">⭐</span>
              <span>YOUR ZONE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Zone Sheet / Directory (Right on PC) */}
      <div className="lg:col-span-5 space-y-3">
        {selectedZone ? (
          <div className="p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 relative">
            <button
              onClick={() => setSelectedZone(null)}
              className="absolute top-4 right-4 p-1.5 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-card active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-black text-primary tracking-wider font-mono">
                  Zone {selectedZone.sort_order} Radar
                </span>
                {isAssignedZone(selectedZone) && (
                  <span className="text-[10px] font-black text-primary-foreground bg-primary border-2 border-border shadow-[1px_1px_0px_var(--border)] px-2 py-0.5">
                    YOUR ZONE ⭐
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-foreground mt-0.5 font-mono flex items-center gap-2">
                <span>{selectedZone.name}</span>
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-0.5 bg-muted border border-border">
                  {getZoneTagline(selectedZone)}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                {selectedZone.description}
              </p>

              {/* Zone Battle Standing Badge */}
              <div className="mt-3 p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Zone Battle Score:
                  </span>
                </div>
                <span className="font-mono font-black text-primary text-sm">
                  🪙 {(selectedZone.coins_collected || 0).toLocaleString()} VIBE
                </span>
              </div>
            </div>

            {/* Missions & Experiences */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Missions & Experiences ({selectedZoneExperiences.length})</span>
                </h4>
                <span className="text-[10px] text-muted-foreground font-mono font-bold">
                  {selectedZoneExperiences.filter((e) => completedExpIds.has(e.id)).length} / {selectedZoneExperiences.length} Done
                </span>
              </div>

              {selectedZoneExperiences.length === 0 ? (
                <div className="p-4 bg-muted border-2 border-border text-center text-xs text-muted-foreground font-bold">
                  No active missions found for this zone right now.
                </div>
              ) : (
                selectedZoneExperiences.map((exp) => {
                  const isCompleted = completedExpIds.has(exp.id);

                  return (
                    <div
                      key={exp.id}
                      className={`p-3.5 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-between transition-all ${
                        isCompleted ? "opacity-80 bg-muted/40" : ""
                      }`}
                    >
                      <div className="space-y-1 flex-1 pr-3">
                        <div className="flex items-center space-x-1.5">
                          <h5 className="text-xs font-black text-foreground font-mono">
                            {exp.title}
                          </h5>
                          {isCompleted && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {exp.description}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] font-mono pt-0.5">
                          {exp.coin_cost > 0 ? (
                            <span className="text-primary font-black">
                              🪙 {exp.coin_cost} Coins
                            </span>
                          ) : (
                            <span className="text-foreground font-black bg-muted px-1.5 py-0.5 border border-border">
                              Free
                            </span>
                          )}
                          <span className="text-primary-foreground font-black bg-primary px-1.5 py-0.5 border border-border">
                            +{exp.xp_reward} XP
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/app/scan?code=vibe-${exp.slug}`}
                        className="neo-btn-primary px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-1 shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan</span>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-primary">
                <Compass className="w-4 h-4" />
                <span className="text-xs font-mono font-black uppercase tracking-wider">
                  Select a Zone to Inspect
                </span>
              </div>
              <h3 className="text-base font-black text-foreground font-mono mt-1">
                Six Official Oceanic Zones
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap on any zone radar circle or select from the directory below to view missions and track championship scores.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {zones.map((z) => {
                const isUser = isAssignedZone(z);
                const status = getZoneStatus(z.id);

                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZone(z)}
                    className="w-full text-left p-2.5 bg-muted hover:bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 bg-card border border-border flex items-center justify-center font-mono font-black text-[11px] text-foreground">
                        Z{z.sort_order}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-foreground font-mono group-hover:text-primary transition-colors">
                            {z.name}
                          </span>
                          {isUser && (
                            <span className="text-[9px] font-black bg-primary text-primary-foreground px-1 py-0.2 border border-border">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          {getZoneTagline(z)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-black text-primary">
                        🪙 {(z.coins_collected || 0).toLocaleString()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
