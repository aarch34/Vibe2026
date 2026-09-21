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
  Eye,
  Crosshair,
} from "lucide-react";
import { Zone, Experience, ExperienceCompletion } from "@/types/database";

interface VenueMapProps {
  zones: Zone[];
  experiences: Experience[];
  userCompletions: ExperienceCompletion[];
  assignedZoneId?: string | null;
}

interface LandmarkConfig {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  landmarkName: string;
  color: string;
  accent: string;
  emoji: string;
}

// 6 Official Oceanic Zone coordinates matching the custom VIBE Archipelago Map
const RETRO_LANDMARKS: Record<string, LandmarkConfig> = {
  arnava: {
    x: 27.2,
    y: 12.8,
    landmarkName: "Lighthouse Bay & Coastal Rocks",
    color: "#0284C7",
    accent: "#38BDF8",
    emoji: "⚓",
  },
  taranaga: {
    x: 73.5,
    y: 11.5,
    landmarkName: "Ocean Vortex & Electric Swirls",
    color: "#6366F1",
    accent: "#A855F7",
    emoji: "🌊",
  },
  sagara: {
    x: 50.0,
    y: 46.5,
    landmarkName: "Sunken Crystal Sanctuary & Ruins",
    color: "#00D2FF",
    accent: "#38BDF8",
    emoji: "🐚",
  },
  pravaha: {
    x: 16.5,
    y: 56.5,
    landmarkName: "River Rapids & Island Bridges",
    color: "#10B981",
    accent: "#34D399",
    emoji: "🌀",
  },
  samudhra: {
    x: 50.0,
    y: 80.0,
    landmarkName: "Sunken Galleon & Coral Reef",
    color: "#F59E0B",
    accent: "#FBBF24",
    emoji: "🔱",
  },
  varuna: {
    x: 84.0,
    y: 64.5,
    landmarkName: "Royal Atlantis Palace & Pearl Cave",
    color: "#FF2E93",
    accent: "#F472B6",
    emoji: "👑",
  },
};

const ZONE_TAGLINES: Record<string, string> = {
  arnava: "The Rising Tide",
  taranaga: "The Electric Ripple",
  sagara: "The Deep Ocean",
  pravaha: "The Rushing Current",
  samudhra: "The Endless Ocean",
  varuna: "The Celestial Waters",
};

function getZoneSlugKey(zone: Zone): string {
  return (zone.slug || zone.name || "").replace(/^z-/, "").toLowerCase();
}

function getZoneTagline(zone: Zone): string {
  const key = getZoneSlugKey(zone);
  return zone.tagline || ZONE_TAGLINES[key] || "Oceanic Zone";
}

function getLandmark(zone: Zone, index: number): LandmarkConfig {
  const key = getZoneSlugKey(zone);
  if (RETRO_LANDMARKS[key]) {
    return RETRO_LANDMARKS[key];
  }
  const fallbackList: LandmarkConfig[] = [
    { x: 27.2, y: 12.8, landmarkName: "Lighthouse Bay", color: "#0284C7", accent: "#38BDF8", emoji: "⚓" },
    { x: 73.5, y: 11.5, landmarkName: "Ocean Vortex", color: "#6366F1", accent: "#A855F7", emoji: "🌊" },
    { x: 50.0, y: 46.5, landmarkName: "Crystal Sanctuary", color: "#00D2FF", accent: "#38BDF8", emoji: "🐚" },
    { x: 16.5, y: 56.5, landmarkName: "River Rapids", color: "#10B981", accent: "#34D399", emoji: "🌀" },
    { x: 50.0, y: 80.0, landmarkName: "Sunken Galleon", color: "#F59E0B", accent: "#FBBF24", emoji: "🔱" },
    { x: 84.0, y: 64.5, landmarkName: "Royal Atlantis Palace", color: "#FF2E93", accent: "#F472B6", emoji: "👑" },
  ];
  return fallbackList[index % fallbackList.length];
}

export function VenueMap({
  zones,
  experiences,
  userCompletions,
  assignedZoneId,
}: VenueMapProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showScanlines, setShowScanlines] = useState(false);
  const [showPins, setShowPins] = useState(true);

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
      <div className="lg:col-span-7 space-y-3">
        <div className="relative w-full bg-[#050b1a] border-2 border-border shadow-neo p-3 overflow-hidden flex flex-col justify-between">
          {/* Retro Game Header Bar */}
          <div className="flex items-center justify-between z-20 px-2 py-1.5 bg-card/90 border border-border/80 backdrop-blur-md mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="text-[11px] font-mono font-black text-foreground tracking-wider uppercase flex items-center gap-1.5">
                <span>🌊</span>
                <span>VIBE 2026 Oceanic Archipelago</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setShowPins((v) => !v)}
                className={`px-2 py-0.5 border text-[9px] font-black uppercase transition-colors cursor-pointer ${
                  showPins
                    ? "bg-secondary text-secondary-foreground border-border"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                PINS {showPins ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                onClick={() => setShowScanlines((v) => !v)}
                className={`px-2 py-0.5 border text-[9px] font-black uppercase transition-colors cursor-pointer ${
                  showScanlines
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                CRT {showScanlines ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Map Display Viewport */}
          <div className="relative w-full aspect-square max-w-[620px] mx-auto overflow-hidden border-2 border-border/90 shadow-inner bg-black select-none">
            {/* Base Pixel Island Map Graphic (Optimized 105 KB Asset) */}
            <img
              src="/assets/map/retro_island_map.png"
              alt="VIBE 2026 Oceanic Archipelago Pixel Map"
              className="w-full h-full object-cover pointer-events-none"
              style={{
                imageRendering: "pixelated",
              }}
            />

            {/* Optional CRT Retro Scanline Overlay */}
            {showScanlines && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20 z-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)",
                }}
              />
            )}

            {/* Interactive Zone Pins Anchored to Landmarks */}
            {showPins &&
              zones.map((zone, idx) => {
                const landmark = getLandmark(zone, idx);
                const status = getZoneStatus(zone.id);
                const isSelected = selectedZone?.id === zone.id;
                const isUserZone = isAssignedZone(zone);

                let statusBorder = landmark.color;
                if (status === "completed") statusBorder = "#10B981";
                else if (status === "in_progress") statusBorder = "#FF2E93";

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    style={{
                      left: `${landmark.x}%`,
                      top: `${landmark.y}%`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform duration-200 hover:scale-110 active:scale-95"
                  >
                    {/* Outer Pulsing Beacon Aura */}
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                      style={{
                        backgroundColor: landmark.color,
                        transform: "scale(1.9)",
                      }}
                    />

                    {/* Highlight Ring When Assigned or Selected */}
                    {(isSelected || isUserZone) && (
                      <div
                        className={`absolute -inset-2 rounded-full border-2 border-dashed ${
                          isSelected ? "border-cyan-300 animate-spin" : "border-pink-500 animate-pulse"
                        }`}
                        style={{ animationDuration: isSelected ? "4s" : "2s" }}
                      />
                    )}

                    {/* Main Interactive Beacon Node */}
                    <div
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                        isSelected
                          ? "bg-slate-950 scale-110 ring-2 ring-cyan-400"
                          : "bg-slate-900/95 hover:bg-slate-900"
                      }`}
                      style={{
                        borderColor: isSelected ? "#00D2FF" : statusBorder,
                        boxShadow: `0 0 14px ${landmark.color}aa`,
                      }}
                    >
                      <span className="text-sm sm:text-base leading-none">
                        {landmark.emoji}
                      </span>

                      {/* Checkmark badge if zone completed */}
                      {status === "completed" && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border border-slate-900 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-black stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* "YOUR ZONE" Star Banner */}
                    {isUserZone && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                        <span className="px-1.5 py-0.2 bg-primary text-primary-foreground border border-black text-[9px] font-mono font-black shadow-md">
                          YOUR ZONE ⭐
                        </span>
                      </div>
                    )}

                    {/* Zone Badge Tag */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap pointer-events-none">
                      <div
                        className={`px-1.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider border shadow-md flex items-center gap-1 ${
                          isSelected
                            ? "bg-cyan-500 text-black border-white"
                            : isUserZone
                            ? "bg-pink-600 text-white border-pink-300"
                            : "bg-black/90 text-white border-white/30 backdrop-blur-sm"
                        }`}
                      >
                        <span>Z{zone.sort_order}</span>
                        <span>{zone.name.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Status Legend Bar */}
          <div className="mt-2 bg-card/90 border border-border shadow-[2px_2px_0px_var(--border)] py-2 px-3 flex items-center justify-around text-[10px] font-black text-foreground font-mono flex-wrap gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#10B981] border border-border" />
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#FF2E93] border border-border" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#00D2FF] border border-border" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[#FF2E93] text-xs">⭐</span>
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

            {(() => {
              const landmark = getLandmark(
                selectedZone,
                zones.findIndex((z) => z.id === selectedZone.id)
              );
              return (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-black text-primary tracking-wider font-mono">
                      Zone {selectedZone.sort_order} • {landmark.landmarkName}
                    </span>
                    {isAssignedZone(selectedZone) && (
                      <span className="text-[10px] font-black text-primary-foreground bg-primary border-2 border-border shadow-[1px_1px_0px_var(--border)] px-2 py-0.5">
                        YOUR ZONE ⭐
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-foreground mt-0.5 font-mono flex items-center gap-2">
                    <span>{landmark.emoji}</span>
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
              );
            })()}

            {/* Missions & Experiences in Selected Zone */}
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
                  Select an Island Zone to Inspect
                </span>
              </div>
              <h3 className="text-base font-black text-foreground font-mono mt-1">
                Six Official Oceanic Zones
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap on any zone signpost on the map or pick from the directory below to view missions and track championship scores.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {zones.map((z, idx) => {
                const isUser = isAssignedZone(z);
                const landmark = getLandmark(z, idx);

                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZone(z)}
                    className="w-full text-left p-2.5 bg-muted hover:bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 bg-card border border-border flex items-center justify-center font-mono font-black text-xs text-foreground">
                        {landmark.emoji}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-foreground font-mono group-hover:text-primary transition-colors">
                            {z.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            (Z{z.sort_order})
                          </span>
                          {isUser && (
                            <span className="text-[9px] font-black bg-primary text-primary-foreground px-1 py-0.2 border border-border">
                              YOU ⭐
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          {landmark.landmarkName} • {getZoneTagline(z)}
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
