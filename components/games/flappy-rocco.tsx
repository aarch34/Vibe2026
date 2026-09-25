"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Award,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

export interface FlappyRoccoProps {
  userBalance?: number;
  onFinished?: () => void;
  onClose?: () => void;
  onScoreSubmitted?: (score: number, maxScore: number, xp: number) => void;
}

interface PipePair {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

let sharedAudioCtx: any = null;

export function FlappyRocco({
  userBalance = 0,
  onFinished,
  onClose,
  onScoreSubmitted,
}: FlappyRoccoProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // References for game loop
  const roccoImgRef = useRef<HTMLImageElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const stateRef = useRef({
    gameState: "ready" as "ready" | "playing" | "gameover",
    birdY: 200,
    velocity: 0,
    gravity: 0.38,
    jump: -6.8,
    pipes: [] as PipePair[],
    score: 0,
    frameCount: 0,
    width: 380,
    height: 500,
  });

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vibe_flappy_rocco_best");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch (_) {}
  }, []);

  // Preload ROCCO sprite
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/rocco/rocco_flappy_sprite.png";
    img.onload = () => {
      roccoImgRef.current = img;
    };
    img.onerror = () => {
      img.src = "/images/games/roco.png";
    };
  }, []);

  // Safe AudioContext unlock and synth for jump, score, and hit beeps
  function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!sharedAudioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
        sharedAudioCtx.resume().catch(() => {});
      }
      return sharedAudioCtx;
    } catch {
      return null;
    }
  }

  function playBeep(type: "jump" | "score" | "hit") {
    if (!soundEnabledRef.current) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Clean up audio nodes from memory when playback finishes
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      if (type === "jump") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "score") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "hit") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (_) {}
  }

  // Flap jump action
  function handleFlap() {
    getAudioContext();
    if (stateRef.current.gameState === "ready") {
      stateRef.current.gameState = "playing";
      setGameState("playing");
      stateRef.current.velocity = stateRef.current.jump;
      playBeep("jump");
    } else if (stateRef.current.gameState === "playing") {
      stateRef.current.velocity = stateRef.current.jump;
      playBeep("jump");
    }
  }

  // Keyboard handler (Space or Up arrow)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleFlap();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 380;
    const height = 500;
    canvas.width = width;
    canvas.height = height;
    stateRef.current.width = width;
    stateRef.current.height = height;

    const birdRadius = 15;
    const pipeWidth = 52;
    const pipeGap = 145; // Comfortable, fair vertical clearance
    const minPipeDistance = 215; // Generous horizontal spacing so pillars NEVER overlap or bunch up
    const groundHeight = 36;
    const speed = 2.2; // Smooth arcade scroll rate

    let isRunning = true;

    function resetGame() {
      stateRef.current.birdY = 220;
      stateRef.current.velocity = 0;
      stateRef.current.pipes = [];
      stateRef.current.score = 0;
      setScore(0);
      stateRef.current.frameCount = 0;
    }

    resetGame();

    async function triggerGameOver(finalScore: number) {
      if (stateRef.current.gameState === "gameover") return;
      stateRef.current.gameState = "gameover";
      setGameState("gameover");
      playBeep("hit");
      
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }

      // Update local best
      setHighScore((prev) => {
        const nextBest = Math.max(prev, finalScore);
        try {
          localStorage.setItem("vibe_flappy_rocco_best", nextBest.toString());
        } catch (_) {}
        return nextBest;
      });

      // STRICT SKILL GATE: XP is ONLY awarded if at least 5 pillars are cleared!
      const isMaster = finalScore >= 10;
      const isQualified = finalScore >= 5;
      const xpPayout = isMaster ? 25 : isQualified ? 15 : 0;

      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        if (isMaster) {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
        }
        if (onScoreSubmitted) {
          await onScoreSubmitted(finalScore, 20, xpPayout);
        }
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Network error submitting score");
      } finally {
        setIsSubmitting(false);
      }
    }

    function render() {
      if (!isRunning || !ctx) return;

      const state = stateRef.current;
      state.frameCount++;

      // 1. Draw Arcade Cyber Background
      ctx.fillStyle = "#090915";
      ctx.fillRect(0, 0, width, height);

      // Distant neon grid lines
      ctx.strokeStyle = "rgba(76, 29, 149, 0.25)";
      ctx.lineWidth = 1;
      for (let y = 30; y < height - groundHeight; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = (state.frameCount * 0.4) % 35; x < width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - groundHeight);
        ctx.stroke();
      }

      // 2. Physics & Logic when Playing
      if (state.gameState === "playing") {
        state.velocity += state.gravity;
        state.birdY += state.velocity;

        // Deterministic distance-based pipe generation
        const lastPipe = state.pipes[state.pipes.length - 1];
        if (!lastPipe) {
          const minH = 65;
          const maxH = height - groundHeight - pipeGap - minH;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          state.pipes.push({
            x: width + 60,
            topHeight: topH,
            bottomY: topH + pipeGap,
            passed: false,
          });
        } else if (lastPipe.x <= width - minPipeDistance) {
          const minH = 65;
          const maxH = height - groundHeight - pipeGap - minH;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          state.pipes.push({
            x: width + 10,
            topHeight: topH,
            bottomY: topH + pipeGap,
            passed: false,
          });
        }

        // Move pipes
        for (let i = 0; i < state.pipes.length; i++) {
          const p = state.pipes[i];
          p.x -= speed;

          // Check score pass
          const birdX = 85;
          if (!p.passed && p.x + pipeWidth < birdX) {
            p.passed = true;
            state.score++;
            setScore(state.score);
            playBeep("score");
          }

          // Fair collision check with forgiving hitbox margins
          const birdBox = {
            left: birdX - birdRadius + 3,
            right: birdX + birdRadius - 3,
            top: state.birdY - birdRadius + 3,
            bottom: state.birdY + birdRadius - 3,
          };

          // Hit upper pipe
          if (
            birdBox.right > p.x &&
            birdBox.left < p.x + pipeWidth &&
            birdBox.top < p.topHeight
          ) {
            triggerGameOver(state.score);
          }

          // Hit lower pipe
          if (
            birdBox.right > p.x &&
            birdBox.left < p.x + pipeWidth &&
            birdBox.bottom > p.bottomY
          ) {
            triggerGameOver(state.score);
          }
        }

        // Clean up off-screen pipes
        state.pipes = state.pipes.filter((p) => p.x + pipeWidth > -30);

        // Ceiling collision (soft clamp - don't instakill)
        if (state.birdY - birdRadius < 0) {
          state.birdY = birdRadius;
          state.velocity = 0;
        }

        // Floor collision
        if (state.birdY + birdRadius >= height - groundHeight) {
          state.birdY = height - groundHeight - birdRadius;
          triggerGameOver(state.score);
        }
      } else if (state.gameState === "ready") {
        // Bobbing hover animation
        state.birdY = 220 + Math.sin(state.frameCount * 0.08) * 6;
      }

      // 3. Draw Pipes (Neon Soundwave Equalizer Columns)
      for (const p of state.pipes) {
        // Top Pipe
        const topGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        topGrad.addColorStop(0, "#7C3AED");
        topGrad.addColorStop(0.5, "#A855F7");
        topGrad.addColorStop(1, "#6D28D9");
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);

        // Top Pipe Border & Cap
        ctx.strokeStyle = "#C084FC";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, pipeWidth, p.topHeight);
        ctx.fillStyle = "#E9D5FF";
        ctx.fillRect(p.x - 3, p.topHeight - 12, pipeWidth + 6, 12);
        ctx.strokeRect(p.x - 3, p.topHeight - 12, pipeWidth + 6, 12);

        // Soundwave accent line inside top pipe
        ctx.strokeStyle = "rgba(233, 213, 255, 0.4)";
        ctx.beginPath();
        ctx.moveTo(p.x + pipeWidth / 2, 0);
        ctx.lineTo(p.x + pipeWidth / 2, p.topHeight - 12);
        ctx.stroke();

        // Bottom Pipe
        const botH = height - groundHeight - p.bottomY;
        const botGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        botGrad.addColorStop(0, "#0284C7");
        botGrad.addColorStop(0.5, "#00D2FF");
        botGrad.addColorStop(1, "#0369A1");
        ctx.fillStyle = botGrad;
        ctx.fillRect(p.x, p.bottomY, pipeWidth, botH);

        // Bottom Pipe Border & Cap
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.bottomY, pipeWidth, botH);
        ctx.fillStyle = "#BAE6FD";
        ctx.fillRect(p.x - 3, p.bottomY, pipeWidth + 6, 12);
        ctx.strokeRect(p.x - 3, p.bottomY, pipeWidth + 6, 12);

        // Soundwave accent line inside bottom pipe
        ctx.strokeStyle = "rgba(186, 230, 253, 0.4)";
        ctx.beginPath();
        ctx.moveTo(p.x + pipeWidth / 2, p.bottomY + 12);
        ctx.lineTo(p.x + pipeWidth / 2, height - groundHeight);
        ctx.stroke();
      }

      // 4. Draw Ground Platform
      const groundGrad = ctx.createLinearGradient(0, height - groundHeight, 0, height);
      groundGrad.addColorStop(0, "#1F1A3A");
      groundGrad.addColorStop(1, "#0D0A1E");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height - groundHeight, width, groundHeight);

      // Neon ground separator stripe
      ctx.strokeStyle = "#FF2E93";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, height - groundHeight);
      ctx.lineTo(width, height - groundHeight);
      ctx.stroke();

      // Moving ground hazard dashes
      ctx.strokeStyle = "rgba(255, 46, 147, 0.4)";
      ctx.lineWidth = 2;
      const groundOffset = (state.frameCount * 2.5) % 20;
      for (let x = -groundOffset; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, height - groundHeight + 4);
        ctx.lineTo(x + 8, height);
        ctx.stroke();
      }

      // 5. Draw ROCCO (The Flappy Bird)
      const birdX = 85;
      const birdY = state.birdY;
      const angle = Math.min(
        Math.PI / 4,
        Math.max(-Math.PI / 5, state.velocity * 0.08)
      );

      ctx.save();
      ctx.translate(birdX, birdY);
      ctx.rotate(angle);

      if (roccoImgRef.current && roccoImgRef.current.complete) {
        const size = 38;
        ctx.drawImage(roccoImgRef.current, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#334155";
        ctx.fill();
        ctx.strokeStyle = "#FF2E93";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦝", 0, 0);
      }

      ctx.restore();

      // 6. Draw HUD Score & Skill Gate Tracker
      if (state.gameState === "playing") {
        ctx.font = "900 32px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.fillText(`${state.score}`, width / 2 + 2, 48);
        ctx.fillStyle =
          state.score >= 10 ? "#FACC15" : state.score >= 5 ? "#10B981" : "#00D2FF";
        ctx.fillText(`${state.score}`, width / 2, 46);

        // Skill Gate Badge underneath
        ctx.font = "bold 10px monospace";
        if (state.score >= 10) {
          ctx.fillStyle = "#FACC15";
          ctx.fillText("⭐ MASTER BONUS UNLOCKED (+25 XP) ⭐", width / 2, 68);
        } else if (state.score >= 5) {
          ctx.fillStyle = "#34D399";
          ctx.fillText("✨ SKILL GATE PASSED (+15 XP) ✨", width / 2, 68);
        } else {
          ctx.fillStyle = "#94A3B8";
          ctx.fillText(`GATE: ${state.score}/5 PILLARS FOR XP`, width / 2, 68);
        }
      }

      // Draw Ready Hint
      if (state.gameState === "ready") {
        ctx.font = "900 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FF2E93";
        ctx.fillText("TAP SCREEN OR PRESS SPACE", width / 2, 320);
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#CBD5E1";
        ctx.fillText("Jump ≥ 5 pillars to earn XP rewards!", width / 2, 344);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    }

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  function handlePlayAgain() {
    setGameState("ready");
    stateRef.current.gameState = "ready";
    stateRef.current.birdY = 220;
    stateRef.current.velocity = 0;
    stateRef.current.pipes = [];
    stateRef.current.score = 0;
    setScore(0);
    setPayoutResult(null);
    setErrorMsg(null);
  }

  const isHighScoreSession = score >= 10;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Arcade Header Bar */}
      <div className="p-3 bg-card border-2 border-border shadow-neo flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🦝</span>
          <div>
            <h2 className="text-xs font-black text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>Flappy ROCCO</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-primary text-primary-foreground border border-border">
                MASCOT FLAP
              </span>
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              Best Score: <strong>{highScore}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-1.5 bg-muted text-foreground border border-border hover:bg-card active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {(onClose || onFinished) && (
            <button
              onClick={() => (onClose ? onClose() : onFinished?.())}
              className="p-1.5 bg-muted text-foreground border border-border hover:bg-destructive hover:text-white active:scale-95 transition-all cursor-pointer text-[10px] font-mono font-bold px-2.5"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Main Game Stage Area */}
      <div
        className="relative bg-black border-2 border-border shadow-neo overflow-hidden select-none cursor-pointer flex justify-center items-center"
        onClick={handleFlap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleFlap();
        }}
        style={{ touchAction: "manipulation" }}
      >
        <canvas ref={canvasRef} className="block w-full max-w-[380px] h-[500px]" />

        {/* Game Over Pop-Up Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 p-5 flex flex-col justify-center items-center text-center space-y-3">
            {/* Popcorn Shocked ROCCO Mascot Photo */}
            <div className="relative w-24 h-28 mx-auto rounded-xl border-2 border-border overflow-hidden shadow-neo bg-[#120E26]">
              <img
                src="/assets/rocco/rocco_game_over.png"
                alt="Shocked ROCCO eating popcorn"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/images/games/roco.png";
                }}
              />
              <div className="absolute top-1 right-1 px-1 bg-red-600 text-white text-[9px] font-mono font-black border border-black">
                CRASH!
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono font-black text-pink-400 tracking-wider">
                Run Concluded
              </span>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">
                Score: {score} Pillars
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-0.5">
                {isHighScoreSession
                  ? "🎉 Incredible flight! You unlocked the Master Flapper bonus (+25 XP & +10 VIBE)!"
                  : score >= 5
                  ? "Great control! You passed the 5-pillar skill gate and earned +15 XP!"
                  : `You must jump through at least 5 pillars to earn XP. (Reached: ${score}/5)`}
              </p>
            </div>

            {score < 5 && (
              <div className="p-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold max-w-xs mx-auto">
                ⚠️ Jump ≥ 5 pillars to unlock XP rewards!
              </div>
            )}

            {/* Reward Payout Breakdown */}
            {isSubmitting ? (
              <div className="py-2 flex items-center justify-center space-x-2 text-xs font-mono text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording score...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900 border border-slate-700 w-full max-w-xs font-mono text-xs text-white shadow-inner">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    XP Earned
                  </span>
                  <span
                    className={
                      score >= 5
                        ? "text-purple-300 font-black text-sm"
                        : "text-slate-500 font-bold text-sm"
                    }
                  >
                    +{isHighScoreSession ? 25 : score >= 5 ? 15 : 0} XP
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    VIBE Bonus
                  </span>
                  <span
                    className={
                      score >= 10
                        ? "text-amber-400 font-black text-sm"
                        : "text-slate-500 font-bold text-sm"
                    }
                  >
                    +{isHighScoreSession ? 10 : 0} VIBE
                  </span>
                </div>
              </div>
            )}

            {errorMsg && <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-1 w-full max-w-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAgain();
                }}
                className="flex-1 py-3 neo-btn-primary text-xs font-black uppercase tracking-wider space-x-1 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flap Again</span>
              </button>

              {(onClose || onFinished) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClose) onClose();
                    else if (onFinished) onFinished();
                  }}
                  className="py-3 px-3 neo-btn-card text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Hub
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions & Bonus Criteria */}
      <div className="p-3 bg-card border-2 border-border shadow-neo space-y-1.5 text-xs text-muted-foreground font-mono">
        <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
          <span>Controls: Click / Tap / Spacebar</span>
          <span className="text-emerald-400 font-black">Entry: FREE</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          🏆 <strong>Skill Threshold:</strong> Jump <strong>≥ 5 pillars</strong> to earn{" "}
          <span className="text-purple-400 font-black">+15 XP</span>. Jump{" "}
          <strong>≥ 10 pillars</strong> for Master Bonus (
          <span className="text-purple-400 font-black">+25 XP</span> &{" "}
          <span className="text-amber-400 font-black">+10 VIBE Coins</span>
          ). Scores below 5 earn 0 XP.
        </p>
      </div>
    </div>
  );
}
