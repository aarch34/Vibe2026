"use client";

import React, { useState } from "react";
import { QrCode, Download, Printer, Plus, Check } from "lucide-react";
import { adminGenerateQRCodeAction } from "@/actions/admin/manage";

interface AdminQRClientProps {
  initialQRs: {
    code: string;
    experienceTitle: string;
    zoneName: string;
  }[];
  experiences: { id: string; title: string }[];
}

export function AdminQRClient({
  initialQRs,
  experiences,
}: AdminQRClientProps) {
  const [qrs, setQrs] = useState(initialQRs);
  const [selectedExpId, setSelectedExpId] = useState(experiences[0]?.id || "");
  const [customCode, setCustomCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleCreateQR(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpId) return;
    setIsGenerating(true);
    setMsg(null);

    const res = await adminGenerateQRCodeAction({
      experienceId: selectedExpId,
      customCode: customCode.trim() || undefined,
    });

    if (res.success && res.qr) {
      const exp = experiences.find((x) => x.id === selectedExpId);
      setQrs([
        {
          code: res.qr.code,
          experienceTitle: exp?.title || "New Experience",
          zoneName: "Venue Zone",
        },
        ...qrs,
      ]);
      setCustomCode("");
      setMsg(`QR Checkpoint generated successfully: ${res.qr.code}`);
    } else {
      setMsg(res.message || "Failed to generate QR code");
    }

    setIsGenerating(false);
  }

  return (
    <div className="space-y-6">
      {/* 1. Generator Form */}
      <form
        onSubmit={handleCreateQR}
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
      >
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Generate New Zone QR Checkpoint</span>
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Select Experience
            </label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Custom Code / Slug (Optional)
            </label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="e.g. vibe-stage-special-2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {msg && (
            <span className="text-xs font-medium text-emerald-400">{msg}</span>
          )}
          <button
            type="submit"
            disabled={isGenerating}
            className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Create Checkpoint QR"}
          </button>
        </div>
      </form>

      {/* 2. Printable Cards Layout */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Active Signboard Checkpoints ({qrs.length})
            </h2>
            <p className="text-xs text-slate-400">
              Print or export these high-contrast checkpoint badges for venue setup
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Badges</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {qrs.map((qr) => (
            <div
              key={qr.code}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-3 shadow-md"
            >
              <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner">
                {/* Visual QR Code Placeholder Representation */}
                <QrCode className="w-full h-full text-slate-950" />
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {qr.zoneName}
                </span>
                <h4 className="text-xs font-black text-white">
                  {qr.experienceTitle}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                  {qr.code}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
