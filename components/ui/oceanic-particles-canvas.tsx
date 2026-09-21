"use client";

import React, { useMemo } from "react";

// Predefined deterministic particle distribution (Zero JavaScript runtime animation loops, 100% GPU-composited CSS)
const PARTICLES = [
  { id: 1, top: "8%", left: "15%", size: 3, color: "bg-cyan-400", duration: "7s", delay: "0s" },
  { id: 2, top: "18%", left: "75%", size: 4, color: "bg-violet-400", duration: "9s", delay: "1.2s" },
  { id: 3, top: "28%", left: "35%", size: 2, color: "bg-pink-400", duration: "6s", delay: "2.5s" },
  { id: 4, top: "38%", left: "85%", size: 3, color: "bg-emerald-400", duration: "8s", delay: "0.8s" },
  { id: 5, top: "48%", left: "12%", size: 4, color: "bg-cyan-300", duration: "10s", delay: "3s" },
  { id: 6, top: "58%", left: "55%", size: 2, color: "bg-violet-300", duration: "7.5s", delay: "1.8s" },
  { id: 7, top: "68%", left: "22%", size: 3, color: "bg-pink-400", duration: "8.5s", delay: "4s" },
  { id: 8, top: "78%", left: "80%", size: 4, color: "bg-cyan-400", duration: "11s", delay: "2.1s" },
  { id: 9, top: "88%", left: "42%", size: 2, color: "bg-emerald-300", duration: "7s", delay: "3.5s" },
  { id: 10, top: "12%", left: "48%", size: 3, color: "bg-pink-500", duration: "9.5s", delay: "0.5s" },
  { id: 11, top: "32%", left: "62%", size: 2, color: "bg-cyan-400", duration: "8s", delay: "1.6s" },
  { id: 12, top: "72%", left: "68%", size: 3, color: "bg-violet-400", duration: "10s", delay: "2.8s" },
];

export function OceanicParticlesCanvas({
  className = "absolute inset-0 pointer-events-none -z-10",
}: {
  className?: string;
}) {
  return (
    <div className={`${className} overflow-hidden`} aria-hidden="true">
      {/* GPU-composited CSS ambient glow points */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} blur-[1px] shadow-sm animate-pulse pointer-events-none`}
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: 0.65,
            transform: "translateZ(0)", // Force hardware layer creation
          }}
        />
      ))}
    </div>
  );
}
