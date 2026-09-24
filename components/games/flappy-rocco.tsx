"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Zap, X, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

interface FlappyRoccoProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

interface Obstacle {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  hasBonus: boolean;
  bonusCollected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export function FlappyRocco({ onScoreSubmitted, onClose }: FlappyRoccoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio Context (Synthesized sound effects)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: "flap" | "point" | "bonus" | "crash") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "flap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "point") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "bonus") {
        osc.type = "square";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(750, now + 0.06);
        osc.frequency.setValueAtTime(1000, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Game Engine State (Refs for 60fps loop)
  const engineRef = useRef({
    rocoY: 220,
    rocoVelocity: 0,
    rocoRotation: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    score: 0,
    gameRunning: false,
    groundOffset: 0,
    cityOffset: 0,
    imgLoaded: false,
    rocoImg: null as HTMLImageElement | null,
  });

  // Load Roco character image
  useEffect(() => {
    const img = new window.Image();
    img.src = "/images/games/roco.png";
    img.onload = () => {
      engineRef.current.rocoImg = img;
      engineRef.current.imgLoaded = true;
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gravity = 0.36;
    const jumpImpulse = -7.2;
    const pipeSpeed = 2.4;
    const pipeWidth = 58;
    const pipeGap = 135;
    const spawnDistance = 220;

    const gameWidth = canvas.width;
    const gameHeight = canvas.height;
    const groundHeight = 55;

    const handleFlap = () => {
      if (!engineRef.current.gameRunning) return;
      engineRef.current.rocoVelocity = jumpImpulse;
      playSound("flap");

      // Spawn flap dust particles
      for (let i = 0; i < 4; i++) {
        engineRef.current.particles.push({
          x: 80,
          y: engineRef.current.rocoY + 15,
          vx: -(Math.random() * 2 + 1),
          vy: Math.random() * 2 - 1,
          color: Math.random() > 0.5 ? "#f43f5e" : "#06b6d4",
          alpha: 0.8,
          size: Math.random() * 3 + 2,
        });
      }
    };

    const triggerGameOver = () => {
      engineRef.current.gameRunning = false;
      playSound("crash");

      const finalScore = engineRef.current.score;
      // Calculate XP: 25 base XP for participating, +5 XP per 10 points, max 125 XP
      const calculatedXp = Math.min(125, 25 + Math.floor(finalScore / 2) * 5);

      setScore(finalScore);
      setBestScore((prev) => Math.max(prev, finalScore));
      setXpEarned(calculatedXp);
      setGameState("gameover");

      setIsSubmitting(true);
      onScoreSubmitted(finalScore, 50, calculatedXp).finally(() => {
        setIsSubmitting(false);
      });
    };

    // Keyboard & Touch Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameState === "playing") {
          handleFlap();
        } else if (gameState === "ready") {
          startGame();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const render = () => {
      const state = engineRef.current;

      // ── 1. Clear & Background Sky ──
      const grad = ctx.createLinearGradient(0, 0, 0, gameHeight);
      grad.addColorStop(0, "#0b031d");
      grad.addColorStop(0.5, "#25093f");
      grad.addColorStop(0.85, "#4c0556");
      grad.addColorStop(1, "#831843");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, gameWidth, gameHeight);

      // Background Synthwave Sun
      ctx.save();
      const sunGrad = ctx.createRadialGradient(gameWidth / 2, 280, 10, gameWidth / 2, 280, 120);
      sunGrad.addColorStop(0, "rgba(244, 63, 94, 0.45)");
      sunGrad.addColorStop(0.6, "rgba(236, 72, 153, 0.2)");
      sunGrad.addColorStop(1, "rgba(236, 72, 153, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(gameWidth / 2, 280, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant City Skyline
      if (state.gameRunning) {
        state.cityOffset = (state.cityOffset + 0.4) % 120;
      }
      ctx.fillStyle = "rgba(15, 6, 35, 0.75)";
      for (let x = -state.cityOffset; x < gameWidth + 60; x += 30) {
        const h = 40 + ((Math.abs(x * 13)) % 55);
        ctx.fillRect(x, gameHeight - groundHeight - h, 26, h);
      }

      // ── 2. Update Physics when Playing ──
      if (state.gameRunning) {
        state.rocoVelocity += gravity;
        state.rocoY += state.rocoVelocity;
        state.rocoRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, state.rocoVelocity * 0.08));

        // Ground collision
        if (state.rocoY >= gameHeight - groundHeight - 20) {
          state.rocoY = gameHeight - groundHeight - 20;
          triggerGameOver();
        }
        // Ceiling clamp
        if (state.rocoY < 18) {
          state.rocoY = 18;
          state.rocoVelocity = 0;
        }

        // Move Ground
        state.groundOffset = (state.groundOffset + pipeSpeed) % 24;

        // Obstacles movement & spawning
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= pipeSpeed;

          // Check passed for points
          if (!obs.passed && obs.x + pipeWidth < 80) {
            obs.passed = true;
            state.score += 1;
            setScore(state.score);
            playSound("point");
          }

          // Bonus item collision
          if (obs.hasBonus && !obs.bonusCollected) {
            const bonusX = obs.x + pipeWidth / 2;
            const bonusY = obs.topHeight + pipeGap / 2;
            const dist = Math.hypot(80 - bonusX, state.rocoY - bonusY);
            if (dist < 28) {
              obs.bonusCollected = true;
              state.score += 5;
              setScore(state.score);
              playSound("bonus");

              // Sparkle particles for bonus
              for (let p = 0; p < 8; p++) {
                state.particles.push({
                  x: bonusX,
                  y: bonusY,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: "#fbbf24",
                  alpha: 1,
                  size: Math.random() * 4 + 2,
                });
              }
            }
          }

          // Pipe Collision Detection
          const rocoBox = {
            left: 64,
            right: 96,
            top: state.rocoY - 16,
            bottom: state.rocoY + 16,
          };

          const pipeBoxTop = {
            left: obs.x,
            right: obs.x + pipeWidth,
            top: 0,
            bottom: obs.topHeight,
          };

          const pipeBoxBottom = {
            left: obs.x,
            right: obs.x + pipeWidth,
            top: obs.topHeight + pipeGap,
            bottom: gameHeight - groundHeight,
          };

          const collides = (a: typeof rocoBox, b: typeof pipeBoxTop) => {
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          };

          if (collides(rocoBox, pipeBoxTop) || collides(rocoBox, pipeBoxBottom)) {
            triggerGameOver();
          }

          // Remove offscreen
          if (obs.x < -pipeWidth) {
            state.obstacles.splice(i, 1);
          }
        }

        // Spawn new obstacle
        const lastObstacle = state.obstacles[state.obstacles.length - 1];
        if (!lastObstacle || lastObstacle.x <= gameWidth - spawnDistance) {
          const minPipe = 60;
          const maxPipe = gameHeight - groundHeight - pipeGap - minPipe;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          const hasBonus = Math.random() > 0.45;

          state.obstacles.push({
            x: gameWidth + 10,
            topHeight,
            bottomHeight: gameHeight - groundHeight - pipeGap - topHeight,
            passed: false,
            hasBonus,
            bonusCollected: false,
          });
        }
      }

      // ── 3. Draw Neon Pipes ──
      for (const obs of state.obstacles) {
        // Top Pipe
        const topGrad = ctx.createLinearGradient(obs.x, 0, obs.x + pipeWidth, 0);
        topGrad.addColorStop(0, "#06b6d4");
        topGrad.addColorStop(0.5, "#3b82f6");
        topGrad.addColorStop(1, "#1e3a8a");
        ctx.fillStyle = topGrad;
        ctx.fillRect(obs.x, 0, pipeWidth, obs.topHeight);

        // Pipe rim
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(obs.x - 3, obs.topHeight - 16, pipeWidth + 6, 16);

        // Bottom Pipe
        const btmY = obs.topHeight + pipeGap;
        const btmHeight = gameHeight - groundHeight - btmY;
        const btmGrad = ctx.createLinearGradient(obs.x, btmY, obs.x + pipeWidth, btmY);
        btmGrad.addColorStop(0, "#ec4899");
        btmGrad.addColorStop(0.5, "#d946ef");
        btmGrad.addColorStop(1, "#831843");
        ctx.fillStyle = btmGrad;
        ctx.fillRect(obs.x, btmY, pipeWidth, btmHeight);

        // Pipe rim
        ctx.fillStyle = "#f472b6";
        ctx.fillRect(obs.x - 3, btmY, pipeWidth + 6, 16);

        // Draw Collectible Bonus Item (Popcorn bucket / Rotaract Star)
        if (obs.hasBonus && !obs.bonusCollected) {
          const bonusX = obs.x + pipeWidth / 2;
          const bonusY = obs.topHeight + pipeGap / 2;
          ctx.save();
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 12;
          ctx.font = "20px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🍿", bonusX, bonusY);
          ctx.restore();
        }
      }

      // ── 4. Draw Particles ──
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 5. Draw ROCO Player ──
      ctx.save();
      ctx.translate(80, state.rocoY);
      ctx.rotate(state.rocoRotation);

      if (state.imgLoaded && state.rocoImg) {
        // Draw Roco Character with subtle glow
        ctx.shadowColor = "#ec4899";
        ctx.shadowBlur = 10;
        // Image aspect ratio adjustment
        ctx.drawImage(state.rocoImg, -24, -28, 48, 56);
      } else {
        // Fallback Raccoon Emoji
        ctx.font = "34px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦝", 0, 0);
      }
      ctx.restore();

      // ── 6. Draw Moving Ground ──
      ctx.fillStyle = "#090214";
      ctx.fillRect(0, gameHeight - groundHeight, gameWidth, groundHeight);

      // Neon Top Border of Ground
      const lineGrad = ctx.createLinearGradient(0, 0, gameWidth, 0);
      lineGrad.addColorStop(0, "#06b6d4");
      lineGrad.addColorStop(0.5, "#ec4899");
      lineGrad.addColorStop(1, "#eab308");
      ctx.fillStyle = lineGrad;
      ctx.fillRect(0, gameHeight - groundHeight, gameWidth, 4);

      // Grid Lines on Ground
      ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
      ctx.lineWidth = 1;
      for (let gx = -state.groundOffset; gx < gameWidth; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, gameHeight - groundHeight + 4);
        ctx.lineTo(gx - 20, gameHeight);
        ctx.stroke();
      }

      // ── 7. Top HUD (Live Score) ──
      if (state.gameRunning) {
        ctx.save();
        ctx.font = "900 36px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.textAlign = "center";
        ctx.fillText(`${state.score}`, gameWidth / 2, 48);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gameState, soundEnabled]);

  const startGame = () => {
    engineRef.current.rocoY = 220;
    engineRef.current.rocoVelocity = 0;
    engineRef.current.rocoRotation = 0;
    engineRef.current.obstacles = [];
    engineRef.current.particles = [];
    engineRef.current.score = 0;
    engineRef.current.gameRunning = true;
    setScore(0);
    setGameState("playing");
    playSound("flap");
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (gameState === "ready") {
      startGame();
    } else if (gameState === "playing") {
      engineRef.current.rocoVelocity = -7.2;
      playSound("flap");
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden border border-purple-500/30 bg-black shadow-2xl select-none">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400 bg-secondary/80 flex items-center justify-center">
            <Image
              src="/images/games/roco.png"
              alt="ROCO"
              width={32}
              height={32}
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-wide uppercase">ROCO FLAPPIE</h2>
            <span className="text-[10px] text-amber-400 font-mono font-bold">VIBE 2026 OFFICIAL</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-full bg-black/40 text-muted-foreground hover:text-white transition-all"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 text-muted-foreground hover:text-white transition-all"
            aria-label="Close Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        className="w-full flex justify-center cursor-pointer"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      >
        <canvas
          ref={canvasRef}
          width={380}
          height={520}
          className="w-full h-auto max-h-[560px] block"
        />
      </div>

      {/* Start Screen Overlay */}
      {gameState === "ready" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm text-center space-y-4">
          <div className="relative w-28 h-28 mx-auto animate-bounce">
            <Image
              src="/images/games/roco.png"
              alt="ROCO Mascot"
              fill
              className="object-contain drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]"
              priority
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 tracking-wider">
              ROCO FLAPPIE
            </h1>
            <p className="text-xs text-muted-foreground max-w-xs">
              Guide ROCO through the neon towers! Collect popcorn 🍿 for +5 bonus points and earn milestone XP.
            </p>
          </div>

          <button
            onClick={startGame}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-black text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>TAP TO FLAP</span>
          </button>

          <p className="text-[11px] text-muted-foreground/80 font-mono">
            Keyboard: Spacebar or ↑ Arrow
          </p>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground uppercase tracking-wide">
              GAME OVER!
            </h2>
            <p className="text-xs text-muted-foreground">Nice flight! Keep practicing to climb the leaderboard.</p>
          </div>

          {/* Stats Box */}
          <div className="w-full max-w-xs p-4 rounded-2xl bg-secondary/60 border border-border/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-bold">SCORE:</span>
              <span className="font-mono font-black text-xl text-foreground">{score}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-bold">BEST:</span>
              <span className="font-mono font-black text-base text-cyan-400">{bestScore}</span>
            </div>
            <div className="border-t border-border/60 pt-2 flex justify-between items-center text-xs">
              <span className="text-amber-400 font-bold flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>XP EARNED:</span>
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">+{xpEarned} XP</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-3 w-full max-w-xs pt-2">
            <button
              onClick={startGame}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-extrabold text-xs border border-border transition-all"
            >
              EXIT ARENA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
