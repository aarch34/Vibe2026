"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trophy, X, Play, RefreshCw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export interface SanjayRunProps {
  userBalance?: number;
  onScoreSubmitted?: (score: number, maxScore: number, xp: number) => void;
  onClose?: () => void;
  onFinished?: () => void;
}

export function SanjayRun({
  userBalance = 0,
  onScoreSubmitted,
  onClose,
  onFinished,
}: SanjayRunProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerStart = useRef<{x: number, y: number} | null>(null);
  
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for game loop to avoid dependency closures
  const stateRef = useRef({
    gameState: "ready" as "ready" | "playing" | "gameover",
    lastTime: 0,
    score: 0,
    speed: 6,
    spawnTimer: 900,
    groundOffset: 0,
    ducking: false,
    player: {
      x: 115,
      y: 316,
      width: 58,
      height: 76,
      velocityY: 0,
      gravity: 0.72,
      jumpForce: -14.5,
      onGround: true,
      frame: 0,
      animationTimer: 0,
    },
    obstacles: [] as any[],
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vibe_sanjay_run_best");
      if (saved) setBestScore(parseInt(saved, 10) || 0);
    } catch (_) {}
  }, []);

  function handleJump() {
    if (stateRef.current.gameState === "ready") {
      startGame();
      return;
    }
    const p = stateRef.current.player;
    if (p.onGround && !stateRef.current.ducking) {
      p.velocityY = p.jumpForce;
      p.onGround = false;
    }
  }

  function handleDuck(isDucking: boolean) {
    stateRef.current.ducking = isDucking;
    const p = stateRef.current.player;
    // If we trigger a duck while in the air, do a fast-fall to instantly get back to the ground
    if (isDucking && !p.onGround) {
      p.velocityY += 15; 
    }
  }

  function startGame() {
    if (stateRef.current.gameState === "playing") return;
    stateRef.current.gameState = "playing";
    stateRef.current.lastTime = performance.now();
    setGameState("playing");
  }

  function resetGame() {
    stateRef.current = {
      gameState: "ready",
      lastTime: 0,
      score: 0,
      speed: 6,
      spawnTimer: 900,
      groundOffset: 0,
      ducking: false,
      player: {
        x: 115,
        y: 316,
        width: 58,
        height: 76,
        velocityY: 0,
        gravity: 0.72,
        jumpForce: -14.5,
        onGround: true,
        frame: 0,
        animationTimer: 0,
      },
      obstacles: [],
    };
    setScore(0);
    setGameState("ready");
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        handleDuck(true);
      } else if (e.code === "KeyR") {
        e.preventDefault();
        resetGame();
        startGame();
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "ArrowDown") {
        e.preventDefault();
        handleDuck(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Attempt to load the sprite
    let spriteImage = new Image();
    spriteImage.src = "/images/games/sanjay-sprite.png";

    let animFrameId: number;
    let isRunning = true;

    async function gameOver() {
      if (stateRef.current.gameState === "gameover") return;
      stateRef.current.gameState = "gameover";
      setGameState("gameover");

      const finalScore = Math.floor(stateRef.current.score);
      setBestScore((prev) => {
        const next = Math.max(prev, finalScore);
        try { localStorage.setItem("vibe_sanjay_run_best", next.toString()); } catch (_) {}
        return next;
      });

      // Calculate XP properly based on score
      const isMaster = finalScore >= 1000;
      const isPro = finalScore >= 500;
      const isQualified = finalScore >= 100;
      
      let xpPayout = 0;
      if (isMaster) xpPayout = 25;
      else if (isPro) xpPayout = 10;
      else if (isQualified) xpPayout = 5;

      if (xpPayout > 0) {
        confetti({ particleCount: xpPayout * 2, spread: 80, origin: { y: 0.6 } });
      }
      setXpEarned(xpPayout);

      setIsSubmitting(true);
      if (onScoreSubmitted) {
        await onScoreSubmitted(finalScore, 2000, xpPayout);
      }
      setIsSubmitting(false);
    }

    function checkCollision(obstacle: any, player: any, ducking: boolean) {
      const isSliding = ducking && player.onGround;
      
      const px1 = player.x + (isSliding ? -40 : 15);
      const px2 = player.x + (isSliding ? 35 : player.width - 15);
      const py1 = player.y + (isSliding ? 40 : 10);
      const py2 = player.y + (isSliding ? 84 : player.height - 8);

      const ox1 = obstacle.x + 5;
      const ox2 = obstacle.x + obstacle.width - 5;
      const oy1 = obstacle.y + 4;
      const oy2 = obstacle.y + obstacle.height - 4;

      return (
        px1 < ox2 &&
        px2 > ox1 &&
        py1 < oy2 &&
        py2 > oy1
      );
    }

    function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }

    // High quality vector-like drawing of Sanjay based on the sprite
    function drawSanjayVector(ctx: CanvasRenderingContext2D, x: number, y: number, p: any, ducking: boolean) {
      const isSliding = ducking && p.onGround;
      const swing = isSliding ? 0 : ([-5, 5, -5, 5][p.frame] || 0);
      
      ctx.save();
      if (isSliding) {
         ctx.translate(x + 29, y + 64);
         ctx.rotate(-Math.PI / 2);
         ctx.translate(-(x + 29), -(y + 84));
      }
      // Suit Base
      drawPixel(ctx, x+16, y+38, 42, 31, "#1e293b"); // dark blue suit
      // White shirt
      drawPixel(ctx, x+33, y+38, 12, 15, "#ffffff");
      // Tie
      drawPixel(ctx, x+37, y+40, 5, 20, "#3b82f6");
      // Gold Ribbon/Medal
      drawPixel(ctx, x+17, y+39, 6, 30, "#eab308"); // left sash
      drawPixel(ctx, x+48, y+39, 6, 30, "#eab308"); // right sash
      drawPixel(ctx, x+32, y+58, 10, 10, "#fbbf24"); // medal
      
      // Face
      drawPixel(ctx, x+18, y+10, 37, 29, "#d28965"); // skin
      // Hair and beard
      drawPixel(ctx, x+15, y-5, 38, 15, "#0f172a"); // hair top
      drawPixel(ctx, x+12, y+2, 10, 20, "#0f172a"); // hair back
      drawPixel(ctx, x+38, y+30, 20, 10, "#0f172a"); // beard
      
      // Eye & Smile
      drawPixel(ctx, x+45, y+16, 5, 5, "#000000"); // eye
      drawPixel(ctx, x+53, y+16, 2, 5, "#ffffff"); // eye glint
      drawPixel(ctx, x+48, y+27, 8, 3, "#ffffff"); // teeth
      
      // Arms
      drawPixel(ctx, x+8, y+42 + swing, 10, 25, "#1e293b"); // left arm
      drawPixel(ctx, x+55, y+42 - swing, 10, 25, "#1e293b"); // right arm
      
      // Hands (skin)
      drawPixel(ctx, x+8, y+67 + swing, 10, 8, "#d28965");
      drawPixel(ctx, x+55, y+67 - swing, 10, 8, "#d28965");

      // Legs
      if (p.onGround) {
        drawPixel(ctx, x+23, y+64, 12, 25 + swing, "#0f172a");
        drawPixel(ctx, x+44, y+64, 12, 25 - swing, "#0f172a");
        // Shoes
        drawPixel(ctx, x+14, y+84 + swing, 22, 9, "#451a03"); // brown shoes
        drawPixel(ctx, x+43, y+84 - swing, 22, 9, "#451a03");
      } else {
        // Jumping legs
        drawPixel(ctx, x+12, y+65, 22, 10, "#0f172a");
        drawPixel(ctx, x+45, y+55, 22, 10, "#0f172a"); // one leg up
        drawPixel(ctx, x+12, y+75, 22, 9, "#451a03"); 
        drawPixel(ctx, x+45, y+65, 22, 9, "#451a03");
      }
      ctx.restore();
    }

    function drawObstacle(ctx: CanvasRenderingContext2D, obs: any) {
      if (obs.type === "missile") {
        // Exhaust Flame (animated randomly for flicker)
        const flameLength = 10 + Math.random() * 8;
        drawPixel(ctx, obs.x + obs.width, obs.y + 4, flameLength, 6, "#ef4444"); // Red flame
        drawPixel(ctx, obs.x + obs.width, obs.y + 5, flameLength - 4, 4, "#eab308"); // Yellow core
        
        // Main Body
        drawPixel(ctx, obs.x + 8, obs.y + 2, obs.width - 8, 10, "#94a3b8");
        
        // Nose Cone (left side)
        drawPixel(ctx, obs.x, obs.y + 4, 8, 6, "#ef4444");
        drawPixel(ctx, obs.x + 4, obs.y + 2, 4, 10, "#ef4444");
        
        // Fins
        drawPixel(ctx, obs.x + obs.width - 12, obs.y - 2, 8, 4, "#64748b"); // Top fin
        drawPixel(ctx, obs.x + obs.width - 12, obs.y + 12, 8, 4, "#64748b"); // Bottom fin
        
        // Window / Detail
        drawPixel(ctx, obs.x + 15, obs.y + 5, 4, 4, "#0ea5e9");
      } else {
        // Cactus
        drawPixel(ctx, obs.x + 8, obs.y, 16, obs.height, "#22c55e");
        drawPixel(ctx, obs.x, obs.y + 15, 16, 12, "#16a34a");
        if (obs.type === "double" || obs.type === "triple") {
          drawPixel(ctx, obs.x + 30, obs.y + 12, 16, obs.height - 12, "#15803d");
        }
        if (obs.type === "triple") {
          drawPixel(ctx, obs.x + 53, obs.y + 20, 16, obs.height - 20, "#166534");
        }
      }
    }

    function gameLoop(currentTime: number) {
      if (!isRunning) return;
      const st = stateRef.current;
      
      if (st.gameState === "playing") {
        const deltaTime = Math.min(34, currentTime - (st.lastTime || currentTime));
        st.lastTime = currentTime;
        const frameScale = deltaTime / 16.67;

        st.score += st.speed * frameScale * 0.09;
        st.speed = Math.min(14, st.speed + 0.0015 * frameScale);
        st.groundOffset = (st.groundOffset + st.speed * frameScale) % 48;
        st.spawnTimer -= deltaTime;

        if (st.spawnTimer <= 0) {
          const type = Math.random() > 0.75 && st.speed > 8 ? "missile" : 
                       Math.random() > 0.65 ? "triple" :
                       Math.random() > 0.35 ? "double" : "cactus";
          
          if (type === "missile") {
            const missileY = Math.random() > 0.5 ? 335 : 370;
            st.obstacles.push({ type, x: canvas!.width + 20, y: missileY, width: 45, height: 14 });
          } else {
            const h = 42 + Math.random() * 24;
            let w = 31;
            if (type === "double") w = 54;
            if (type === "triple") w = 77;
            st.obstacles.push({ type, x: canvas!.width + 20, y: 400 - h, width: w, height: h });
          }
          st.spawnTimer = Math.max(430, ((700 + Math.random() * 450) / st.speed) * 16.67);
        }

        // Physics
        st.player.velocityY += st.player.gravity * frameScale;
        st.player.y += st.player.velocityY * frameScale;
        if (st.player.y >= 316) {
          st.player.y = 316;
          st.player.velocityY = 0;
          st.player.onGround = true;
        }

        // Animation
        st.player.animationTimer += deltaTime;
        const animSpeed = 75 - Math.min(25, (st.speed - 6) * 4);
        if (st.player.animationTimer > animSpeed) {
          st.player.frame = (st.player.frame + 1) % 4;
          st.player.animationTimer = 0;
        }

        // Move Obs
        st.obstacles.forEach(o => o.x -= st.speed * frameScale);
        st.obstacles = st.obstacles.filter(o => o.x > -90);

        // Collisions
        for (const obs of st.obstacles) {
          if (checkCollision(obs, st.player, st.ducking)) {
            gameOver();
            break;
          }
        }
        setScore(Math.floor(st.score));
      }

      // Draw
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      
      const isNight = st.score % 1800 > 1250;
      
      // Sky
      drawPixel(ctx!, 0, 0, w, h, isNight ? "#0f172a" : "#38bdf8");
      
      // Sun/Moon
      drawPixel(ctx!, w - 115, 52, 55, 55, isNight ? "#fef08a" : "#facc15");

      // Clouds
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 230 - st.score * 0.12) % (w + 180) + w + 180) % (w + 180) - 90;
        const cy = 82 + (i % 3) * 42;
        const cColor = isNight ? "#334155" : "#f0f9ff";
        drawPixel(ctx!, cx, cy, 75, 13, cColor);
        drawPixel(ctx!, cx + 15, cy - 9, 28, 22, cColor);
      }

      // City Silhouette
      for (let x = 0; x < w; x += 100) {
        const bh = 25 + (x * 13 % 50);
        drawPixel(ctx!, x, 400 - bh, 62, bh, isNight ? "#1e293b" : "#7dd3fc");
      }

      // Ground
      drawPixel(ctx!, 0, 400, w, h - 400, "#1c1917"); // dirt brown
      drawPixel(ctx!, 0, 400, w, 5, "#15803d"); // grass top

      for (let x = -st.groundOffset; x < w; x += 48) {
        drawPixel(ctx!, x, 420, 28, 5, "#292524");
      }
      for (let x = 20 - st.groundOffset * 0.6; x < w; x += 92) {
        drawPixel(ctx!, x, 441, 38, 3, "#292524");
      }

      st.obstacles.forEach(o => drawObstacle(ctx!, o));
      
      // Draw Player
      let drawnFromSprite = false;
      if (spriteImage.complete && spriteImage.naturalWidth > 0) {
         // Attempt to draw from sprite sheet
         const sw = 100; // estimated single frame width
         const sh = 100;
         const sx = (st.player.frame) * sw;
         const sy = 0;
         
         // Only draw if we successfully mapped it
         // Wait, drawing from the provided mockup image with exact crop is risky
      }
      
      if (!drawnFromSprite) {
         drawSanjayVector(ctx!, st.player.x, st.player.y, st.player, st.ducking);
      }
      
      // HUD (Score)
      if (st.gameState === "playing") {
        ctx!.fillStyle = isNight ? "#ffffff" : "#1e293b";
        ctx!.font = "900 24px monospace";
        ctx!.textAlign = "right";
        ctx!.fillText(`${Math.floor(st.score).toString().padStart(5, '0')}`, w - 20, 35);
      }

      animFrameId = requestAnimationFrame(gameLoop);
    }
    
    animFrameId = requestAnimationFrame(gameLoop);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Arcade Header Bar */}
      <div className="p-3 bg-card border-2 border-border shadow-neo flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🏃</span>
          <div>
            <h2 className="text-xs font-black text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>Sanjay Run</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-primary text-primary-foreground border border-border">
                ENDLESS
              </span>
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              Best Score: <strong>{String(bestScore).padStart(5, '0')}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-muted text-foreground border border-border hover:bg-destructive hover:text-white active:scale-95 transition-all cursor-pointer text-[10px] font-mono font-bold px-2.5"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-black border-2 border-border shadow-neo overflow-hidden select-none cursor-pointer flex justify-center items-center">
        <canvas 
          ref={canvasRef} 
          width={380}
          height={500}
          className="block w-full max-w-[380px] h-auto aspect-[380/500] bg-sky-400 touch-none"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            pointerStart.current = { x: e.clientX, y: e.clientY };
            if (gameState === "playing") handleJump();
            else if (gameState === "ready") startGame();
          }}
          onPointerMove={(e) => {
            if (!pointerStart.current) return;
            const dy = e.clientY - pointerStart.current.y;
            if (dy > 30) {
              if (gameState === "playing") handleDuck(true);
            }
          }}
          onPointerUp={() => {
            if (gameState === "playing") handleDuck(false);
            pointerStart.current = null;
          }}
          onPointerCancel={() => {
            if (gameState === "playing") handleDuck(false);
            pointerStart.current = null;
          }}
          style={{ imageRendering: "pixelated" }}
        />

        {/* Start Screen */}
        {gameState === "ready" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 p-5 flex flex-col justify-center items-center text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-[0_4px_0_rgba(234,179,8,1)]">
              SANJAY RUN
            </h1>
            <p className="text-[10px] font-bold text-slate-300">READY TO RUN?</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-slate-800 shadow-[4px_4px_0_#1e293b] active:shadow-[0_0_0_#1e293b] active:translate-y-1 active:translate-x-1 text-slate-900 font-black text-sm transition-all"
            >
              TAP TO START
            </button>
            <div className="text-[9px] font-bold text-slate-400 pt-4">
              SPACE / ↑ / TAP = JUMP • ↓ = DUCK
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 p-5 flex flex-col justify-center items-center text-center space-y-3">
            <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_0_rgba(239,68,68,1)]">
              BONK! 💥
            </h2>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-300 uppercase">Sanjay ran</p>
              <p className="text-4xl font-black font-mono text-yellow-400">{score}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase">Metres</p>
            </div>
            
            {xpEarned > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/20 text-yellow-400 rounded-full border border-yellow-400/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black">+{xpEarned} XP EARNED</span>
              </div>
            )}
            
            <div className="flex flex-col items-center justify-center gap-2 pt-2 w-full max-w-xs">
              <button
                onClick={(e) => { e.stopPropagation(); resetGame(); startGame(); }}
                disabled={isSubmitting}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-slate-800 shadow-[4px_4px_0_#1e293b] active:shadow-[0_0_0_#1e293b] active:translate-y-1 active:translate-x-1 text-slate-900 font-black text-xs transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RUN IT BACK</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-card border-2 border-border shadow-neo space-y-1.5 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center justify-between font-bold text-foreground">
          <span className="text-emerald-400 font-black">Entry: FREE</span>
        </div>
        <p className="leading-relaxed">
          <span className="text-yellow-400 font-black">5 - 25 XP</span>. 
          Jump and duck over obstacles in this fast-paced infinite runner!
        </p>
      </div>
    </div>
  );
}
