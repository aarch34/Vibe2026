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
  Flame,
  Waves,
  Send,
} from "lucide-react";
import { completeExperienceAction } from "@/actions/experiences/complete";
import { sendCoinsToZoneAction } from "@/actions/zones/contribute";
import { decodeQRCodeFromImageFile } from "@/lib/qr/scan-image-file";
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

  // Local balance state for real-time optimistic updates
  const [localBalance, setLocalBalance] = useState(userBalance);

  // Zone Cheer state
  const [cheerAmount, setCheerAmount] = useState<number>(50);
  const [isCheering, setIsCheering] = useState(false);
  const [cheerResult, setCheerResult] = useState<any>(null);

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

      // Ensure camera container is visible and marked active
      setIsCameraActive(true);

      // Brief delay to allow container layout pass in DOM
      await new Promise((r) => setTimeout(r, 60));

      const html5QrCode = new Html5Qrcode("html5-qr-video-region");
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edge = Math.max(180, Math.floor(minEdge * 0.72));
          return { width: edge, height: edge };
        },
        aspectRatio: 1.0,
      };

      // Try environment (rear) camera with fallback
      try {
        await html5QrCode.start(
          { facingMode: { ideal: "environment" } },
          qrConfig,
          (decodedText) => {
            stopCamera();
            handleVerifyCode(decodedText);
          },
          () => {}
        );
      } catch (firstErr: any) {
        console.warn("Rear camera failed, retrying with default user camera:", firstErr);
        // Fallback to any available camera
        await html5QrCode.start(
          { facingMode: "user" },
          qrConfig,
          (decodedText) => {
            stopCamera();
            handleVerifyCode(decodedText);
          },
          () => {}
        );
      }
    } catch (err: any) {
      console.warn("Camera start failed completely:", err);
      setCameraError(
        err?.message?.includes("NotAllowedError") || err?.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser or use 'Upload Photo'."
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
      // Use multi-pass decoder (Native BarcodeDetector -> jsQR with canvas scaling -> html5-qrcode fallback)
      const decodedText = await decodeQRCodeFromImageFile(file);

      if (decodedText) {
        handleVerifyCode(decodedText);
      } else {
        setErrorMsg(
          "No valid QR code found in the uploaded image. Please ensure the code is clear or type the token below."
        );
      }
    } catch (err: any) {
      setErrorMsg(
        "Could not decode image. Please try taking a closer photo or type the token below."
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
    setCompletionResult(null);
    setCheerResult(null);
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
        if (data.type === "zone_cheer") {
          setCheerAmount(50);
        }
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
        setErrorMsg(res.message || "Failed to complete checkpoint.");
      } else {
        setCompletionResult(res);
        if (typeof res.balance_after === "number") {
          setLocalBalance(res.balance_after);
        }

        // Trigger celebratory confetti
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#FF2A85", "#A855F7", "#00D2FF", "#10B981"],
          });
        }).catch(() => {});

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleConfirmZoneCheer() {
    if (!verificationResult?.zoneCheer?.zoneId) return;
    if (cheerAmount > localBalance) {
      setErrorMsg(`You have ${formatCoins(localBalance)} Coins. Need ${cheerAmount} Coins.`);
      return;
    }

    setIsCheering(true);
    setErrorMsg(null);

    try {
      const res = await sendCoinsToZoneAction({
        zoneId: verificationResult.zoneCheer.zoneId,
        amount: cheerAmount,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Failed to cheer zone.");
      } else {
        setCheerResult(res);
        if (typeof res.newBalance === "number") {
          setLocalBalance(res.newBalance);
        }

        // Celebratory burst
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#FF2A85", "#F59E0B", "#00D2FF", "#10B981"],
          });
        }).catch(() => {});

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsCheering(false);
    }
  }

  // Preset official event QR codes for quick test & checkpoint discovery
  const sampleQRs = [
    { label: "Cheer Taranaga (Coins)", code: "vibe-activity-taranaga", type: "cheer" },
    { label: "Taranaga Checkpoint (+75 XP)", code: "vibe-zone-taranaga-xp", type: "checkpoint" },
    { label: "Cheer Arnava (Coins)", code: "vibe-activity-arnava", type: "cheer" },
    { label: "Arnava Checkpoint (+75 XP)", code: "vibe-zone-arnava-xp", type: "checkpoint" },
    { label: "Sagara Cipher (+100 XP)", code: "vibe-zone-sagara-xp", type: "checkpoint" },
    { label: "Pravaha Rapids (+75 XP)", code: "vibe-zone-pravaha-xp", type: "checkpoint" },
    { label: "Stall: Memory Match (+50 XP)", code: "vibe-stall-memory-xp", type: "stall" },
    { label: "Stall: 360 Glam Rig (+50 XP)", code: "vibe-stall-glam-xp", type: "stall" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Hidden container for image decoding fallbacks */}
      <div id="html5-qr-hidden-region" className="hidden" />

      {/* Left Column: Viewfinder & Input */}
      <div className="lg:col-span-6 space-y-4">
        {/* 1. Live Camera Scanner Viewfinder */}
        <div className="relative w-full aspect-[4/3] bg-[#090816] text-card-foreground border-2 border-border shadow-neo flex flex-col items-center justify-center p-2 text-center overflow-hidden">
          {/* Active Camera Video Target */}
          <div
            id="html5-qr-video-region"
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{ display: isCameraActive ? "block" : "none" }}
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
                  <ImageIcon className="w-4 h-4 text-secondary" />
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
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary pointer-events-none" />
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
              placeholder="e.g. vibe-activity-taranaga or vibe-zone-arnava-xp"
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
                  className={`neo-btn-card text-[11px] font-mono font-bold px-2.5 py-1.5 border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] ${
                    sample.type === "cheer" ? "bg-amber-500/20 text-amber-300" : ""
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Verification, Celebration, Cheering, or Guide */}
      <div className="lg:col-span-6 space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-destructive text-destructive-foreground border-2 border-border shadow-neo text-xs flex items-center space-x-2.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 3A: ZONE CHEERING & COIN CONTRIBUTION PANEL */}
        {verificationResult?.type === "zone_cheer" && !cheerResult && (
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500 text-black border border-black px-2 py-0.5 inline-flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-black" />
                  Zone Cheering Station • {verificationResult.zoneCheer?.zoneName}
                </span>
                <h3 className="text-lg font-black text-foreground mt-2 font-mono flex items-center gap-2">
                  <span>🌊 Boost Zone {verificationResult.zoneCheer?.zoneName}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                  {verificationResult.zoneCheer?.tagline}
                </p>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="neo-btn-card p-1.5 border-2 border-border shadow-[2px_2px_0px_var(--border)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Zone Stats & User Balance */}
            <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block font-mono">
                  Zone Total Coins
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-base font-black font-mono text-foreground">
                    🪙 {formatCoins(verificationResult.zoneCheer?.totalCoins || 0)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block font-mono">
                  Your Balance
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Coins className="w-4 h-4 text-secondary" />
                  <span className="text-base font-black font-mono text-foreground">
                    {formatCoins(localBalance)} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Coin Amount Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-black uppercase text-foreground block">
                Select Coins to Contribute:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCheerAmount(amt)}
                    className={`py-2 px-1 text-xs font-mono font-black border-2 transition-all ${
                      cheerAmount === amt
                        ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                        : "bg-muted text-muted-foreground border-border hover:bg-card hover:text-foreground"
                    }`}
                  >
                    🪙 {amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] text-muted-foreground font-mono font-bold">Custom:</span>
                <input
                  type="number"
                  min={10}
                  max={Math.min(10000, localBalance)}
                  value={cheerAmount}
                  onChange={(e) => setCheerAmount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-28 p-1.5 bg-muted text-foreground border-2 border-border font-mono text-xs font-black focus:outline-none focus:border-primary"
                />
                <span className="text-[11px] font-mono font-bold text-muted-foreground">Coins</span>
              </div>
            </div>

            {/* Reward calculation breakdown */}
            <div className="p-3 bg-secondary/15 border-2 border-secondary/40 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-foreground">
                <span className="font-bold">Guaranteed Attendee Reward:</span>
                <span className="font-black text-secondary">
                  +{Math.max(25, Math.round(cheerAmount * 0.5))} XP
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Zone Ranking Impact:</span>
                <span className="font-bold text-foreground">
                  +{cheerAmount} Coins to {verificationResult.zoneCheer?.zoneName}
                </span>
              </div>
            </div>

            {/* Confirm Cheer CTA */}
            {localBalance < cheerAmount ? (
              <div className="p-3 bg-destructive/20 border border-destructive text-xs font-bold text-destructive-foreground text-center">
                Insufficient coins. Your balance is {formatCoins(localBalance)} Coins.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmZoneCheer}
                disabled={isCheering}
                className="neo-btn-primary w-full py-3.5 text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center space-x-2 bg-amber-500 text-black border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px]"
              >
                {isCheering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Contributing Coins...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>
                      Cheer Zone with {cheerAmount} Coins (+
                      {Math.max(25, Math.round(cheerAmount * 0.5))} XP)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 3B: SUCCESSFUL ZONE CHEER RECEIPT */}
        {cheerResult && (
          <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-500 text-black border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8 text-black" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500 text-black border border-black inline-block font-mono">
                Zone Cheered!
              </span>
              <h3 className="text-lg font-black text-foreground mt-2 font-mono">
                {cheerResult.zoneName} Received +{cheerResult.coinsSent} Coins!
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Your support has boosted {cheerResult.zoneName}&apos;s rank in the Zone Battle!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                  XP Earned
                </span>
                <p className="text-base font-black font-mono text-primary">
                  +{cheerResult.xpEarned} XP
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                  New Coin Balance
                </span>
                <p className="text-base font-black font-mono text-foreground">
                  {formatCoins(cheerResult.newBalance)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCheerResult(null);
                setVerificationResult(null);
                setManualCode("");
              }}
              className="neo-btn-primary w-full py-3 text-xs font-black uppercase tracking-wider"
            >
              Scan Another QR Code
            </button>
          </div>
        )}

        {/* 3C: STANDARD CHECKPOINT & MISSION PREVIEW */}
        {verificationResult && verificationResult.type !== "zone_cheer" && !completionResult && (
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-secondary text-secondary-foreground border border-border px-2 py-0.5 inline-block font-mono">
                  {verificationResult.type === "checkpoint" ? "Zone Checkpoint" : "Mission Detected"} • {verificationResult.zone?.name}
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
                <span className="text-[10px] font-black uppercase text-muted-foreground block font-mono">
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
                <span className="text-[10px] font-black uppercase text-muted-foreground block font-mono">
                  Guaranteed Reward
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
                  {formatCoins(localBalance)} Coins
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
            {localBalance < verificationResult.coinCost ? (
              <div className="p-4 bg-muted border-2 border-border text-foreground text-left space-y-2.5">
                <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-primary">
                  <Coins className="w-4 h-4 animate-bounce" />
                  <span>Not enough VIBE Coins</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  You need <strong className="text-foreground font-mono font-black">{verificationResult.coinCost} VIBE</strong> to unlock this experience.
                  <br />
                  Your balance: <span className="font-mono text-foreground font-black">{formatCoins(localBalance)} VIBE</span>
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
                    <span>Confirming Checkpoint...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {verificationResult.type === "checkpoint"
                        ? "CLAIM CHECKPOINT VISIT (+75 XP)"
                        : `CONFIRM & UNLOCK (${verificationResult.coinCost > 0 ? `${verificationResult.coinCost} Coins` : "Free"})`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 4. SUCCESSFUL CHECKPOINT / EXPERIENCE COMPLETION */}
        {completionResult && (
          <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 text-center">
            <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground border border-border inline-block font-mono">
                Checkpoint Registered!
              </span>
              <h3 className="text-lg font-black text-foreground mt-2 font-mono">
                {completionResult.experience_title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Your visit has been recorded on your 6-zone passport!
              </p>
            </div>

            {verificationResult?.coinCost > 0 && (
              <div className="p-2.5 bg-muted border-2 border-border text-xs text-foreground font-bold">
                🌊 +{verificationResult.coinCost} VIBE Coins contributed to {verificationResult?.zone?.name || "Zone"}!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
                  XP Earned
                </span>
                <p className="text-base font-black font-mono text-primary">
                  +{completionResult.xp_earned} XP
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">
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
        {!verificationResult && !completionResult && !cheerResult && (
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3.5">
            <div className="flex items-center space-x-2 text-sm font-black text-foreground uppercase font-mono">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h3>How Checkpoints & Cheering Work</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Every zone has physical QR signboards installed across gaming arenas, stages, lounges, and cheering booths.
            </p>
            <div className="space-y-2 pt-1 text-xs text-foreground font-bold">
              <div className="flex items-start space-x-2">
                <span className="text-primary font-black">1.</span>
                <span><strong>Scan Checkpoint QR:</strong> Earn +75 XP and stamp your digital passport.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-amber-400 font-black">2.</span>
                <span><strong>Scan Cheering QR:</strong> Contribute VIBE coins to boost your favorite zone in the live championship ranking.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-cyan-400 font-black">3.</span>
                <span><strong>Upload Photo:</strong> If camera stream is unavailable, take a photo and upload it directly.</span>
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
