"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Zap,
  Music,
  Coffee,
  Camera,
  Utensils,
  Lock,
  CheckCircle2,
  Coins,
  Sparkles,
  X,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { Zone, Experience } from "@/types/database";

interface VenueMapProps {
  zones: Zone[];
  experiences: Experience[];
  userCompletions: { experience_id: string }[];
}

export function VenueMap({
  zones,
  experiences,
  userCompletions,
}: VenueMapProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const completedExpIds = new Set(userCompletions.map((c) => c.experience_id));

  // Determine state of each zone
  function getZoneStatus(zoneId: string) {
    const zoneExps = experiences.filter((e) => e.zone_id === zoneId);
    if (zoneExps.length === 0) return "available";

    const completedInZone = zoneExps.filter((e) => completedExpIds.has(e.id));
    if (completedInZone.length === zoneExps.length) return "completed";
    if (completedInZone.length > 0) return "in_progress";
    return "available";
  }

  const iconMap: Record<string, any> = {
    Gamepad2,
    Zap,
    Music,
    Coffee,
    Camera,
    Utensils,
    Lock,
  };

  const selectedZoneExperiences = selectedZone
    ? experiences.filter((e) => e.zone_id === selectedZone.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Venue Map Container (Left on PC) */}
      <div className="lg:col-span-7 space-y-2">
        <div className="relative w-full aspect-[4/4] sm:aspect-[4/3.6] lg:aspect-auto lg:h-[540px] bg-gradient-to-b from-slate-950 via-[#0B1120] to-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-2xl flex flex-col justify-between">
          {/* SVG Venue Grid & Connecting Pathways */}
          <svg
            viewBox="0 0 400 420"
            className="w-full h-full"
            style={{ touchAction: "manipulation" }}
          >
            <defs>
              <radialGradient id="venueGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Background Ambient Glow */}
            <rect width="400" height="420" fill="url(#venueGlow)" />

            {/* Connecting Pathway Lines */}
            <path
              d="M 120 90 L 200 180 L 280 90 M 120 90 L 90 250 L 130 330 L 200 180 M 280 90 L 310 250 L 270 330 L 200 180 M 130 330 L 270 330"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              className="animate-pulse"
            />

            {/* Central Main Stage Marker */}
            <circle
              cx="200"
              cy="180"
              r="42"
              fill="#1E1B4B"
              stroke="#6366F1"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />

            {/* Interactive Zone Nodes */}
            {zones.map((zone) => {
              const status = getZoneStatus(zone.id);
              const x = zone.map_data?.x || 200;
              const y = zone.map_data?.y || 200;
              const isSelected = selectedZone?.id === zone.id;

              let strokeColor = "#3B82F6";
              let fillColor = "#0F172A";

              if (status === "completed") {
                strokeColor = "#10B981";
                fillColor = "#064E3B";
              } else if (status === "in_progress") {
                strokeColor = "#F59E0B";
                fillColor = "#451A03";
              }

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => setSelectedZone(zone)}
                >
                  {/* Outer halo when selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="34"
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="26"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="transition-all hover:scale-110 active:scale-95"
                  />

                  {/* Zone Number / Status */}
                  <text
                    x={x}
                    y={y - 2}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Z{zone.sort_order}
                  </text>

                  {/* Zone Name Label */}
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={status === "completed" ? "#34D399" : "#94A3B8"}
                    fontSize="8"
                    fontWeight="600"
                  >
                    {zone.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Status Legend */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-lg py-1.5 px-3 flex items-center justify-around text-[10px] font-medium text-slate-400 border border-slate-800">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Zone Sheet / Directory (Right on PC) */}
      <div className="lg:col-span-5 space-y-3">
        {selectedZone ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-xl space-y-4 relative">
            <button
              onClick={() => setSelectedZone(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Zone {selectedZone.sort_order} Inspector
              </span>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                {selectedZone.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {selectedZone.description}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-300">
                Missions & Experiences ({selectedZoneExperiences.length})
              </h4>

              {selectedZoneExperiences.map((exp) => {
                const isCompleted = completedExpIds.has(exp.id);

                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm"
                  >
                    <div className="space-y-0.5 flex-1 pr-3">
                      <div className="flex items-center space-x-1.5">
                        <h5 className="text-xs font-bold text-white">
                          {exp.title}
                        </h5>
                        {isCompleted && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono">
                        {exp.coin_cost > 0 ? (
                          <span className="text-amber-400 font-bold">
                            {exp.coin_cost} Coins
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Free</span>
                        )}
                        <span className="text-purple-300 font-bold">
                          +{exp.xp_reward} XP
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/app/scan?code=vibe-${exp.slug}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white flex items-center space-x-1 shrink-0 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Festival Zone Directory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any zone on the map or click a zone below to inspect available missions and rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
              {zones.map((zone) => {
                const status = getZoneStatus(zone.id);
                const zoneExps = experiences.filter((e) => e.zone_id === zone.id);

                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-md bg-blue-950 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        Z{zone.sort_order}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                          {zone.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {zoneExps.length} missions
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        status === "completed"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : status === "in_progress"
                          ? "bg-amber-950 text-amber-400 border border-amber-500/30"
                          : "bg-blue-950 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </span>
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
