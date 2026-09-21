"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Compass,
  HelpCircle,
  Image as ImageIcon,
  StopCircle,
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

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-verify if code passed via URL
  useEffect(() => {
    const codeInQuery = searchParams.get("code");
    if (codeInQuery) {
      handleVerifyCode(codeInQuery);
    }
  }, [searchParams]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  async function startCamera() {
    setErrorMsg(null);
    setCameraError(null);
    setIsCameraStarting(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode("html5-qr-video-region");
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        qrConfig,
        (decodedText) => {
          // Detected!
          stopCamera();
          handleVerifyCode(decodedText);
        },
        () => {
          // Frame read callback (silent)
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(
        err?.message?.includes("NotAllowedError") || err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser or upload a photo."
          : "Could not open camera stream. Please use 'Upload Photo' or enter the token below."
      );
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  }

  async function handleImageFileScan(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setErrorMsg(null);
    setCameraError(null);
    setIsVerifying(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("html5-qr-hidden-region");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleVerifyCode(decodedText);
    } catch (err: any) {
      setErrorMsg(
        "No valid QR code found in the uploaded image. Please ensure the code is clear or type the token below."
      );
    } finally {
      setIsVerifying(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleVerifyCode(codeToVerify: string) {
    if (!codeToVerify.trim()) return;
    setErrorMsg(null);
    setIsVerifying(true);

    let cleanCode = codeToVerify.trim();
    try {
      if (
        cleanCode.includes("code=") ||
        cleanCode.startsWith("http://") ||
        cleanCode.startsWith("https://")
      ) {
        const parsed = new URL(cleanCode, window.location.origin);
        const param = parsed.searchParams.get("code");
        if (param) cleanCode = param.trim();
      }
    } catch {}

    setScannedCode(cleanCode);

    try {
      const res = await fetch(
        `/api/qr/scan?code=${encodeURIComponent(cleanCode)}`
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
          colors: ["#FF2A85", "#A855F7", "#00D2FF", "#10B981"],
        });

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsCompleting(false);
    }
  }

  // Preset official event QR codes for quick test & checkpoint discovery
  const sampleQRs = [
    { label: "Arnava Checkpoint (+75 XP)", code: "vibe-zone-arnava-xp", cost: 0, xp: 75 },
    { label: "Taranaga Rhythm (+75 XP)", code: "vibe-zone-taranaga-xp", cost: 0, xp: 75 },
    { label: "Sagara Cipher (+100 XP)", code: "vibe-zone-sagara-xp", cost: 0, xp: 100 },
    { label: "Pravaha Rapids (+75 XP)", code: "vibe-zone-pravaha-xp", cost: 0, xp: 75 },
    { label: "Samudhra Glam (+75 XP)", code: "vibe-zone-samudhra-xp", cost: 0, xp: 75 },
    { label: "Varuna Stage (+100 XP)", code: "vibe-zone-varuna-xp", cost: 0, xp: 100 },
    { label: "Stall: Memory Match (+50 XP)", code: "vibe-stall-memory-xp", cost: 0, xp: 50 },
    { label: "Stall: 360 Glam Rig (+50 XP)", code: "vibe-stall-glam-xp", cost: 0, xp: 50 },
    { label: "Stall: Ring Toss (+50 XP)", code: "vibe-stall-ring-xp", cost: 0, xp: 50 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Hidden container for file scan engine */}
      <div id="html5-qr-hidden-region" className="hidden" />

      {/* Left Column: Viewfinder & Input */}
      <div className="lg:col-span-6 space-y-4">
        {/* 1. Live Camera Scanner Viewfinder */}
        <div className="relative w-full aspect-[4/3] bg-[#090816] text-card-foreground border-2 border-border shadow-neo flex flex-col items-center justify-center p-2 text-center overflow-hidden">
          {/* Active Camera Video Target */}
          <div
            id="html5-qr-video-region"
            className={`w-full h-full flex items-center justify-center ${
              isCameraActive ? "block" : "hidden"
            }`}
          />

          {/* Idle State / Controls when camera not streaming */}
          {!isCameraActive && (
            <div className="z-10 space-y-3 px-4 py-6">
              <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase text-foreground font-mono">
                  Live Event QR Scanner
                </h2>
                <p className="text-xs text-muted-foreground font-medium max-w-[260px] mx-auto mt-1">
                  Point your device camera at zone signboards, game stalls, or badge QRs
                </p>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-destructive/20 border border-destructive text-[11px] text-destructive-foreground font-bold">
                  ⚠️ {cameraError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isCameraStarting}
                  className="neo-btn-primary py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  {isCameraStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting Camera...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-btn-card py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 border-2 border-border shadow-[2px_2px_0px_var(--border)]"
                >
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <span>Upload Photo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileScan}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Active Overlay: Laser line and Stop button */}
          {isCameraActive && (
            <>
              {/* Laser animation */}
              <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-primary/50 pointer-events-none z-20">
                <div className="w-full h-1 bg-primary shadow-[0_0_12px_var(--primary)] animate-bounce" />
              </div>
              <div className="absolute bottom-3 inset-x-0 flex justify-center z-30">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="neo-btn bg-destructive text-destructive-foreground border-2 border-border px-4 py-1.5 text-xs font-black uppercase flex items-center space-x-1.5 shadow-[2px_2px_0px_var(--border)]"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              </div>
            </>
          )}

          {/* Corner Accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accent pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accent pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accent pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accent pointer-events-none" />
        </div>

        {/* 2. Manual Code Input */}
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-foreground block font-mono">
            Or Enter Checkpoint Token Manually
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. vibe-zone-arnava-xp"
              className="flex-1 bg-muted border-2 border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground font-mono font-bold focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => handleVerifyCode(manualCode)}
              disabled={isVerifying || !manualCode.trim()}
              className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center space-x-1"
            >
              {isVerifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Verify</span>
              )}
            </button>
          </div>

          {/* Quick Demo Pre-set Badges */}
          <div className="pt-3 border-t-2 border-border">
            <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block mb-2 font-mono">
              Quick Test Checkpoints (Tap to Test):
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleQRs.map((sample) => (
                <button
                  key={sample.code}
                  onClick={() => {
                    setManualCode(sample.code);
                    handleVerifyCode(sample.code);
                  }}
                  className="neo-btn-card text-[11px] font-mono font-bold px-2.5 py-1.5 border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Verification, Celebration, or Guide */}
      <div className="lg:col-span-6 space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-destructive text-destructive-foreground border-2 border-border shadow-neo text-xs flex items-center space-x-2.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Preview Modal */}
        {verificationResult && !completionResult && (
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-secondary text-secondary-foreground border border-border px-2 py-0.5 inline-block font-mono">
                  Checkpoint Detected • {verificationResult.zone?.name}
                </span>
                <h3 className="text-base sm:text-lg font-black text-foreground mt-2 font-mono">
                  {verificationResult.experience?.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                  {verificationResult.experience?.description}
                </p>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="neo-btn-card p-1.5 border-2 border-border shadow-[2px_2px_0px_var(--border)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mission Cost & Rewards Breakdown */}
            <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block">
                  Entry Cost
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Coins className="w-4 h-4 text-foreground" />
                  <span className="text-sm sm:text-base font-black font-mono text-foreground">
                    {verificationResult.coinCost > 0
                      ? `${verificationResult.coinCost} Coins`
                      : "FREE"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block">
                  Reward
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm sm:text-base font-black font-mono text-foreground">
                    +{verificationResult.xpReward} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Attempts info */}
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1 font-mono">
              <span>
                Attempts: {verificationResult.attemptsUsed} /{" "}
                {verificationResult.maxAttempts}
              </span>
              <span>
                Balance:{" "}
                <strong className="text-foreground font-mono font-black">
                  {formatCoins(userBalance)} Coins
                </strong>
              </span>
            </div>

            {/* Zone Battle Impact Callout */}
            {verificationResult.coinCost > 0 && (
              <div className="p-2.5 bg-muted border-2 border-border text-[11px] text-foreground text-left font-bold">
                🌊 <strong>Zone Battle Rule:</strong> {verificationResult.coinCost} VIBE will be transferred to <strong>{verificationResult.zone?.name || "this zone"}</strong>'s championship score!
              </div>
            )}

            {/* Action CTA / Insufficient Balance UX */}
            {userBalance < verificationResult.coinCost ? (
              <div className="p-4 bg-muted border-2 border-border text-foreground text-left space-y-2.5">
                <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-primary">
                  <Coins className="w-4 h-4 animate-bounce" />
                  <span>Not enough VIBE Coins</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  You need <strong className="text-foreground font-mono font-black">{verificationResult.coinCost} VIBE</strong> to unlock this experience.
                  <br />
                  Your balance: <span className="font-mono text-foreground font-black">{formatCoins(userBalance)} VIBE</span>
                </p>
                <div className="text-[11px] text-muted-foreground flex items-center space-x-1.5 pt-1.5 border-t-2 border-border font-bold">
                  <span>💡</span>
                  <span>Discover new zones or complete free challenges to earn more coins.</span>
                </div>
                <Link
                  href="/app/map"
                  className="neo-btn-secondary block text-center py-2.5 px-3 text-xs font-black uppercase tracking-wider"
                >
                  Find Another Experience
                </Link>
              </div>
            ) : !verificationResult.canAttempt ? (
              <div className="text-center p-3.5 bg-muted border-2 border-border text-muted-foreground text-xs font-black">
                Maximum attempts already completed for this mission.
              </div>
            ) : (
              <button
                onClick={handleConfirmCompletion}
                disabled={isCompleting}
                className="neo-btn-primary w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px]"
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
                      CONFIRM & UNLOCK (
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
          <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 text-center">
            <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground border border-border inline-block font-mono">
                Mission Accomplished!
              </span>
              <h3 className="text-lg font-black text-foreground mt-2 font-mono">
                {completionResult.experience_title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Your completion has been registered on the district ledger!
              </p>
            </div>

            {verificationResult?.coinCost > 0 && (
              <div className="p-2.5 bg-muted border-2 border-border text-xs text-foreground font-bold">
                🌊 +{verificationResult.coinCost} VIBE Coins contributed to {verificationResult?.zone?.name || "Zone"}!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  XP Earned
                </span>
                <p className="text-base font-black font-mono text-primary">
                  +{completionResult.xp_earned} XP
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  New Coin Balance
                </span>
                <p className="text-base font-black font-mono text-foreground">
                  {formatCoins(completionResult.balance_after)}
                </p>
              </div>
            </div>

            {completionResult.new_achievements?.length > 0 && (
              <div className="p-3 bg-secondary text-secondary-foreground border-2 border-border text-xs font-bold flex items-center justify-center space-x-2">
                <Trophy className="w-4 h-4" />
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
              className="neo-btn-primary w-full py-3 text-xs font-black uppercase tracking-wider"
            >
              Scan Next Checkpoint
            </button>
          </div>
        )}

        {/* Default Information & Checkpoint Guide when idle */}
        {!verificationResult && !completionResult && (
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3.5">
            <div className="flex items-center space-x-2 text-sm font-black text-foreground uppercase font-mono">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h3>How Checkpoints Work</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Every zone has physical QR signboards installed across gaming arenas, stages, lounges, and sponsor booths.
            </p>
            <div className="space-y-2 pt-1 text-xs text-foreground font-bold">
              <div className="flex items-start space-x-2">
                <span className="text-primary font-black">1.</span>
                <span>Tap "Start Camera Scanner" or upload a photo of any physical QR signboard.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary font-black">2.</span>
                <span>Review the entry coin requirement and guaranteed XP reward.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary font-black">3.</span>
                <span>Confirm unlock: Coins are deducted instantly and XP is awarded atomically.</span>
              </div>
            </div>
            <div className="pt-2 border-t-2 border-border flex items-center justify-between">
              <Link
                href="/app/map"
                className="neo-btn-card px-3 py-1.5 text-xs font-black flex items-center space-x-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>View Checkpoint Coordinates on Map →</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
