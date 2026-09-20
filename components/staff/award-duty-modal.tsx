"use client";

import React, { useState, useTransition } from "react";
import {
  Sparkles,
  Search,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Coins,
  Shield,
  Volume2,
  Store,
  Package,
  Star,
  Edit3,
} from "lucide-react";
import confetti from "canvas-confetti";
import { adminSearchAttendeesAction } from "@/actions/admin/staff-delegation";
import { awardDutyXpAction } from "@/actions/staff/duty-award";

interface AwardDutyModalProps {
  zoneId: string;
  zoneName: string;
  onClose: () => void;
  onSuccess: (award: any) => void;
}

const DUTY_PRESETS = [
  {
    id: "crowd",
    title: "Crowd Control & Safety",
    category: "Crowd Management",
    xp: 100,
    coins: 25,
    icon: Shield,
    desc: "Managed high-traffic zone lanes and entry gates.",
  },
  {
    id: "stage",
    title: "Stage, DJ & Audio Ops",
    category: "Stage Operations",
    xp: 150,
    coins: 50,
    icon: Volume2,
    desc: "Assisted backstage, console cables, and performers.",
  },
  {
    id: "stall",
    title: "Stall Referee & Game Host",
    category: "Stall Coordination",
    xp: 100,
    coins: 25,
    icon: Store,
    desc: "Manned interactive games and verified challenger queues.",
  },
  {
    id: "logistics",
    title: "Logistics, Setup & Tear-down",
    category: "Logistics",
    xp: 120,
    coins: 30,
    icon: Package,
    desc: "Transported festival gear, materials, and booth supplies.",
  },
  {
    id: "hero",
    title: "Festival Hero / Overtime",
    category: "Outstanding Initiative",
    xp: 200,
    coins: 50,
    icon: Star,
    desc: "Stepped up during emergency rush with exceptional leadership.",
  },
  {
    id: "custom",
    title: "Custom Festival Duty",
    category: "Custom Duty",
    xp: 50,
    coins: 10,
    icon: Edit3,
    desc: "Configurable XP and Coins for specialized volunteer duty.",
  },
];

export function AwardDutyModal({
  zoneId,
  zoneName,
  onClose,
  onSuccess,
}: AwardDutyModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "qr">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);

  // Duty selection
  const [selectedPreset, setSelectedPreset] = useState(DUTY_PRESETS[0]);
  const [customXp, setCustomXp] = useState(50);
  const [customCoins, setCustomCoins] = useState(10);
  const [description, setDescription] = useState("");

  // Feedback & submission
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setStatusMsg(null);
    try {
      const res = await adminSearchAttendeesAction(searchQuery);
      if (res.success && res.results) {
        setSearchResults(res.results);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  function handleQuickQrLookup(vibeCode: string) {
    // Quick QR code input or simulation
    setSearchQuery(vibeCode);
    setIsSearching(true);
    adminSearchAttendeesAction(vibeCode).then((res) => {
      setIsSearching(false);
      if (res.success && res.results && res.results.length > 0) {
        setSelectedRecipient(res.results[0]);
        setStatusMsg({ text: `Volunteer identified: ${res.results[0].displayName} (${res.results[0].vibeId})` });
      } else {
        setStatusMsg({ text: "No attendee found matching this code.", isError: true });
      }
    });
  }

  function handleSubmit() {
    if (!selectedRecipient) {
      setStatusMsg({ text: "Please select a volunteer / attendee first.", isError: true });
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setStatusMsg({
        text: "Please provide an explicit duty description (min 5 chars) for the audit log.",
        isError: true,
      });
      return;
    }

    const xpAmount = selectedPreset.id === "custom" ? customXp : selectedPreset.xp;
    const coinAmount = selectedPreset.id === "custom" ? customCoins : selectedPreset.coins;

    startTransition(async () => {
      setStatusMsg(null);
      const res = await awardDutyXpAction({
        targetProfileId: selectedRecipient.id,
        zoneId,
        dutyCategory: selectedPreset.category,
        xpAmount,
        coinAmount,
        description: description.trim(),
      });

      if (res.success) {
        // Trigger confetti
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore in headless
        }

        onSuccess({
          id: res.dutyRecordId,
          recipientName: res.recipientName,
          dutyCategory: selectedPreset.category,
          xpAwarded: xpAmount,
          coinsAwarded: coinAmount,
          description: description.trim(),
          awardedAt: new Date().toISOString(),
        });
        onClose();
      } else {
        setStatusMsg({ text: res.message || "Failed to award duty XP", isError: true });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 max-w-xl w-full p-6 shadow-[8px_8px_0px_#000] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2 text-amber-400 mb-1">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-mono font-bold uppercase">
            {zoneName} Station • Duty Awards
          </span>
        </div>
        <h3 className="text-xl font-black text-white font-mono uppercase tracking-tight mb-2">
          Award Volunteer Duty XP & Coins
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          Reward volunteers and attendees for festival contributions. Awards instantly credit their wallet,
          advance their level, and boost the {zoneName} Zone Championship score.
        </p>

        {/* Status Msg */}
        {statusMsg && (
          <div
            className={`p-3 mb-4 border font-mono text-xs flex items-center space-x-2 ${
              statusMsg.isError
                ? "bg-rose-950/80 border-rose-600 text-rose-300"
                : "bg-emerald-950/80 border-emerald-600 text-emerald-300"
            }`}
          >
            {statusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. Recipient Lookup Tabs */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                1. Identify Volunteer / Person
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-colors ${
                    activeTab === "search"
                      ? "bg-amber-500 text-black"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Search className="w-3 h-3 inline mr-1" /> Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("qr")}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-colors ${
                    activeTab === "qr"
                      ? "bg-amber-500 text-black"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3 h-3 inline mr-1" /> QR Scanner
                </button>
              </div>
            </div>

            {activeTab === "search" ? (
              <div>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Name, VIBE ID (e.g. VIBE-1234)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                      className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-3 py-2 text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="neo-btn-card px-4 py-2 text-xs font-mono font-bold uppercase"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 divide-y divide-slate-800">
                    {searchResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipient(a);
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{a.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {a.vibeId} • {a.college || "Rotaract Member"}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                          Select →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-dashed border-slate-700 text-center">
                <QrCode className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-300 font-mono mb-2">
                  Scan volunteer's personal VIBE QR from their passport or enter their VIBE code:
                </p>
                <div className="flex max-w-xs mx-auto space-x-2">
                  <input
                    type="text"
                    placeholder="Enter VIBE-XXXX..."
                    className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 text-xs font-mono text-center uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleQuickQrLookup((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousSibling as HTMLInputElement).value;
                      handleQuickQrLookup(input);
                    }}
                    className="px-3 py-1.5 bg-amber-500 text-black text-xs font-mono font-bold uppercase"
                  >
                    Match
                  </button>
                </div>
              </div>
            )}

            {/* Selected Recipient Card */}
            {selectedRecipient && (
              <div className="mt-2 p-3 bg-amber-950/40 border border-amber-500/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>{selectedRecipient.displayName}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      [{selectedRecipient.vibeId}]
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    {selectedRecipient.college || "Rotaract Member"}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="text-xs text-rose-400 hover:underline font-mono"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* 2. Duty Presets */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-2">
              2. Select Duty Category & Reward Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DUTY_PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p)}
                    className={`p-3 border text-left font-mono transition-colors ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500 text-white font-bold shadow-[2px_2px_0px_#000]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{p.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 text-[11px] font-black">
                      <span className="text-amber-400">+{p.xp} XP</span>
                      <span className="text-cyan-400">+{p.coins} Coins</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom inputs if custom preset chosen */}
            {selectedPreset.id === "custom" && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    XP to Award (0 - 300)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={customXp}
                    onChange={(e) => setCustomXp(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">
                    Coins to Award (0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={customCoins}
                    onChange={(e) => setCustomCoins(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Mandatory Justification */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
              3. Duty Description & Audit Justification (Mandatory)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Manned stage console entry gate for 2 hours during band setup..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white p-2 text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Recorded in the immutable District Admin audit logs.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 text-slate-300 text-xs font-mono uppercase hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedRecipient || !description.trim() || isPending}
              className="neo-btn-primary px-5 py-2 text-xs font-mono font-bold uppercase flex items-center space-x-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm & Award Duty XP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
