"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  QrCode,
  Camera,
  Coins,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";
import { completeExperienceAction } from "@/actions/experiences/complete";
import { formatCoins, formatXP } from "@/lib/utils";

interface QRScannerClientProps {
  initialCode?: string;
  userBalance: number;
}

export function QRScannerClient({
  initialCode = "",
  userBalance,
}: QRScannerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scannedCode, setScannedCode] = useState(
    initialCode || searchParams.get("code") || ""
  );
  const [manualCode, setManualCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-verify if code passed via URL
  useEffect(() => {
    const codeInQuery = searchParams.get("code");
    if (codeInQuery) {
      handleVerifyCode(codeInQuery);
    }
  }, [searchParams]);

  async function handleVerifyCode(codeToVerify: string) {
    if (!codeToVerify.trim()) return;
    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const res = await fetch(
        `/api/qr/scan?code=${encodeURIComponent(codeToVerify.trim())}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setErrorMsg(data.error || "Invalid QR Code.");
        setVerificationResult(null);
      } else {
        setVerificationResult(data);
      }
    } catch (err: any) {
      setErrorMsg("Failed to verify QR Code. Please check connection.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleConfirmCompletion() {
    if (!verificationResult?.experience) return;
    setIsCompleting(true);
    setErrorMsg(null);

    const idempotencyKey = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await completeExperienceAction({
        experienceId: verificationResult.experience.id,
        qrCodeId: verificationResult.code,
        idempotencyKey,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Failed to complete experience.");
      } else {
        setCompletionResult(res);

        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3B82F6", "#06B6D4", "#F59E0B", "#8B5CF6"],
        });

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsCompleting(false);
    }
  }

  // Preset sample event QR codes for instant test convenience
  const sampleQRs = [
    { label: "VR Cyber Flight", code: "vibe-arcade-vr-2026", cost: 50, xp: 120 },
    { label: "Laser Tag Showdown", code: "vibe-arena-laser-2026", cost: 80, xp: 250 },
    { label: "DJ Drop Face-off", code: "vibe-stage-dj-2026", cost: 0, xp: 80 },
    { label: "Mocktail Lab", code: "vibe-lounge-mocktail-2026", cost: 30, xp: 70 },
    { label: "Secret Vault Cipher", code: "vibe-vault-cipher-2026", cost: 100, xp: 500 },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Camera / Scanner Viewfinder Mockup */}
      <div className="relative w-full aspect-[4/3.5] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center p-4 text-center shadow-2xl">
        {/* Animated Scanning Laser Line */}
        <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-blue-500/40 rounded-xl pointer-events-none">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-bounce" />
        </div>

        {/* Viewfinder Corner Accents */}
        <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-cyan-400" />

        <div className="z-10 space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 animate-pulse">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-white">Point at Zone Checkpoint</h2>
          <p className="text-xs text-slate-400 max-w-[240px]">
            Scan physical QR signboards located across event zones
          </p>
        </div>
      </div>

      {/* 2. Manual Code Input */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          Enter QR Code / Checkpoint Token
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. vibe-arcade-vr-2026"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={() => handleVerifyCode(manualCode)}
            disabled={isVerifying || !manualCode.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition-all shrink-0 flex items-center space-x-1"
          >
            {isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Verify</span>
            )}
          </button>
        </div>

        {/* Quick Demo Pre-set Badges */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
            Quick Checkpoints (Tap to Test):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQRs.map((sample) => (
              <button
                key={sample.code}
                onClick={() => {
                  setManualCode(sample.code);
                  handleVerifyCode(sample.code);
                }}
                className="text-[10px] font-mono font-medium px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Verification Preview Modal */}
      {verificationResult && !completionResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border-2 border-blue-500/50 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Checkpoint Detected • {verificationResult.zone?.name}
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                {verificationResult.experience?.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {verificationResult.experience?.description}
              </p>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mission Cost & Rewards Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Entry Cost</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black font-mono text-white">
                  {verificationResult.coinCost > 0
                    ? `${verificationResult.coinCost} Coins`
                    : "FREE"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Reward</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-black font-mono text-purple-300">
                  +{verificationResult.xpReward} XP
                </span>
              </div>
            </div>
          </div>

          {/* Attempts info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span>
              Attempts: {verificationResult.attemptsUsed} /{" "}
              {verificationResult.maxAttempts}
            </span>
            <span>
              Balance:{" "}
              <strong className="text-amber-400 font-mono">
                {formatCoins(userBalance)} Coins
              </strong>
            </span>
          </div>

          {/* Action CTA */}
          {userBalance < verificationResult.coinCost ? (
            <div className="text-center p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              Insufficient Coins ({formatCoins(userBalance)} available, need{" "}
              {verificationResult.coinCost})
            </div>
          ) : !verificationResult.canAttempt ? (
            <div className="text-center p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
              Maximum attempts already completed for this mission.
            </div>
          ) : (
            <button
              onClick={handleConfirmCompletion}
              disabled={isCompleting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Completing Mission...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Confirm & Unlock (
                    {verificationResult.coinCost > 0
                      ? `${verificationResult.coinCost} Coins`
                      : "Free"}
                    )
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 4. Success Completion Celebration Card */}
      {completionResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Mission Accomplished!
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              {completionResult.experience_title}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Your completion has been registered on the district ledger!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400">XP Earned</span>
              <p className="text-base font-black font-mono text-purple-400">
                +{completionResult.xp_earned} XP
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">New Coin Balance</span>
              <p className="text-base font-black font-mono text-amber-400">
                {formatCoins(completionResult.balance_after)}
              </p>
            </div>
          </div>

          {completionResult.new_achievements?.length > 0 && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-center space-x-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              <span>
                New Achievement:{" "}
                <strong>{completionResult.new_achievements[0].name}</strong>!
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setCompletionResult(null);
              setVerificationResult(null);
              setManualCode("");
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            Scan Next Checkpoint
          </button>
        </div>
      )}
    </div>
  );
}
