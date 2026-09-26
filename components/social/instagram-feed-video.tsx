"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Minimize,
  Heart,
  Loader2,
  RotateCcw,
} from "lucide-react";

// Global feed sound state across posts (Instagram style: unmuting one post un-mutes feed)
let globalFeedMuted = true;

export interface InstagramFeedVideoProps {
  src: string;
  postId: string;
  onDoubleTap?: () => void;
  isShowingHeartAnim?: boolean;
  className?: string;
  autoPlayOnScroll?: boolean;
}

export function InstagramFeedVideo({
  src,
  postId,
  onDoubleTap,
  isShowingHeartAnim = false,
  className = "",
  autoPlayOnScroll = true,
}: InstagramFeedVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(globalFeedMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showLocalHeart, setShowLocalHeart] = useState(false);
  const [feedbackBadge, setFeedbackBadge] = useState<{
    type: "play" | "pause" | "mute" | "unmute";
    key: number;
  } | null>(null);

  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);
  const lastTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const manuallyPausedRef = useRef<boolean>(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger brief Instagram-style center feedback badge
  const triggerFeedbackBadge = useCallback(
    (type: "play" | "pause" | "mute" | "unmute") => {
      setFeedbackBadge({ type, key: Date.now() });
      setTimeout(() => {
        setFeedbackBadge((prev) => (prev?.type === type ? null : prev));
      }, 650);
    },
    []
  );

  // Play video with autoplay & sound-policy safety
  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    // Broadcast active video event to pause any other playing feed video
    window.dispatchEvent(
      new CustomEvent("vibe:active-video", { detail: { id: postId } })
    );

    try {
      video.muted = globalFeedMuted;
      setIsMuted(globalFeedMuted);
      await video.play();
      setIsPlaying(true);
    } catch {
      // If browser blocked unmuted autoplay, fallback immediately to muted autoplay
      if (!video.muted) {
        try {
          video.muted = true;
          globalFeedMuted = true;
          setIsMuted(true);
          await video.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    }
  }, [postId, hasError]);

  // Pause video cleanly
  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      manuallyPausedRef.current = false;
      playVideo();
      triggerFeedbackBadge("play");
    } else {
      manuallyPausedRef.current = true;
      pauseVideo();
      triggerFeedbackBadge("pause");
    }
  }, [playVideo, pauseVideo, triggerFeedbackBadge]);

  // Toggle Mute (Feed-wide sync like Instagram)
  const toggleMute = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const nextMuted = !isMuted;
      globalFeedMuted = nextMuted;
      setIsMuted(nextMuted);

      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
        if (!nextMuted) videoRef.current.volume = 1;
      }

      triggerFeedbackBadge(nextMuted ? "mute" : "unmute");

      // Inform all other videos of sound state change
      window.dispatchEvent(
        new CustomEvent("vibe:feed-mute-change", {
          detail: { muted: nextMuted },
        })
      );
    },
    [isMuted, triggerFeedbackBadge]
  );

  // Toggle Fullscreen
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Trigger double-tap like (bursts pink heart immediately and notifies parent)
  const triggerDoubleTap = useCallback(() => {
    // Cancel pending single tap play/pause action
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }

    // Trigger instant visual heart burst in center
    setShowLocalHeart(true);
    setTimeout(() => {
      setShowLocalHeart(false);
    }, 950);

    // Call like callback
    onDoubleTap?.();
  }, [onDoubleTap]);

  // Handle native desktop double-click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-tap-bubble")) return;
    triggerDoubleTap();
  };

  // Handle mobile touch gestures (reliably catches double-taps on iOS/Android screens)
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".no-tap-bubble")) return;
    const touch = e.touches[0];
    if (touch) {
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".no-tap-bubble")) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    // Reject swipes/scrolls
    const dx = Math.abs(touch.clientX - lastTouchPosRef.current.x);
    const dy = Math.abs(touch.clientY - lastTouchPosRef.current.y);
    if (dx > 25 || dy > 25) return;

    const now = Date.now();
    const timeSinceLast = now - lastTouchTimeRef.current;

    if (timeSinceLast > 40 && timeSinceLast < 380) {
      // Confirmed mobile double-tap!
      lastTouchTimeRef.current = 0;
      triggerDoubleTap();
    } else {
      lastTouchTimeRef.current = now;
    }
  };

  // Handle click / tap on video (Single tap = Play/Pause, Double tap = Like)
  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent interference when clicking bottom controls or speaker button
    if ((e.target as HTMLElement).closest(".no-tap-bubble")) {
      return;
    }

    const now = Date.now();
    if (now - lastTapTimeRef.current < 350) {
      // Double tap detected
      lastTapTimeRef.current = 0;
      triggerDoubleTap();
    } else {
      // Single tap candidate -> wait for possible second tap
      lastTapTimeRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        togglePlayPause();
      }, 260);
    }
  };

  // Hover & Controls Auto-Fade
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Progress Bar Seek
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const seekPercent = clickX / rect.width;
    const newTime = seekPercent * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 1. Intersection Observer: Stops video when scrolled down or away, plays when scrolled in
  useEffect(() => {
    if (!autoPlayOnScroll) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // Scrolled down/away: less than 50% visible -> STOP VIDEO IMMEDIATELY
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
          pauseVideo();
          // Reset manual pause once it completely leaves view so scrolling back plays it fresh
          if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
            manuallyPausedRef.current = false;
          }
        } else if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          // Scrolled into view and prominently visible
          if (!manuallyPausedRef.current) {
            playVideo();
          }
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.6, 0.8, 1.0],
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlayOnScroll, playVideo, pauseVideo]);

  // 2. Active Scroll Listener Safeguard (Guarantees instant stop the moment user scrolls down)
  useEffect(() => {
    if (!autoPlayOnScroll) return;

    const checkScrollPosition = () => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video) return;

      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(vh, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

      // If video has scrolled out of view (< 45% visible, top above viewport, or bottom below)
      if (visibleRatio < 0.45 || rect.bottom <= 40 || rect.top >= vh - 40) {
        if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    document.addEventListener("scroll", checkScrollPosition, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
      document.removeEventListener("scroll", checkScrollPosition, {
        capture: true,
      });
    };
  }, [autoPlayOnScroll]);

  // 3. Tab Visibility (Pause on background tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseVideo();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pauseVideo]);

  // 4. Single Active Video in Feed: Only one video plays at a time
  useEffect(() => {
    const handleActiveVideo = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== postId) {
        pauseVideo();
      }
    };
    window.addEventListener("vibe:active-video", handleActiveVideo);
    return () =>
      window.removeEventListener("vibe:active-video", handleActiveVideo);
  }, [postId, pauseVideo]);

  // 5. Global Feed Mute Synchronization
  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      const nextMuted = customEvent.detail?.muted;
      if (typeof nextMuted === "boolean") {
        setIsMuted(nextMuted);
        if (videoRef.current) {
          videoRef.current.muted = nextMuted;
        }
      }
    };
    window.addEventListener("vibe:feed-mute-change", handleMuteChange);
    return () =>
      window.removeEventListener("vibe:feed-mute-change", handleMuteChange);
  }, []);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: "manipulation" }}
      className={`relative overflow-hidden bg-black flex items-center justify-center select-none group w-full ${className}`}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        preload="metadata"
        muted={isMuted}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className="w-full max-h-[500px] object-contain bg-black select-none pointer-events-auto cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px] z-20">
          <Loader2 className="w-8 h-8 text-white/90 animate-spin drop-shadow" />
        </div>
      )}

      {/* Video Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white z-20 space-y-2">
          <p className="text-xs text-red-400 font-bold">Failed to load video</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="no-tap-bubble px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono flex items-center space-x-1.5 transition-colors border border-white/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Center Feedback Animation Badges (Instagram Style Pop-and-Fade) */}
      {feedbackBadge && (
        <div
          key={feedbackBadge.key}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-75 fade-in duration-150"
        >
          <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl scale-100 transition-all">
            {feedbackBadge.type === "play" && (
              <Play className="w-8 h-8 fill-white ml-1 text-white" />
            )}
            {feedbackBadge.type === "pause" && (
              <Pause className="w-8 h-8 fill-white text-white" />
            )}
            {feedbackBadge.type === "unmute" && (
              <Volume2 className="w-8 h-8 text-white" />
            )}
            {feedbackBadge.type === "mute" && (
              <VolumeX className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Double-Tap Heart Burst Animation */}
      {(isShowingHeartAnim || showLocalHeart) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-in zoom-in-50 fade-in duration-200">
          <Heart className="w-24 h-24 text-pink-500 fill-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.95)] animate-bounce" />
        </div>
      )}

      {/* Floating Center Play Button When Paused */}
      {!isPlaying && !isLoading && !hasError && !feedbackBadge && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/90 border border-white/20 shadow-xl group-hover:scale-105 transition-transform">
            <Play className="w-7 h-7 fill-white/90 ml-1 text-white/90" />
          </div>
        </div>
      )}

      {/* Floating Speaker Mute/Unmute Button (Instagram Bottom-Right Signature Button) */}
      <button
        type="button"
        onClick={toggleMute}
        className="no-tap-bubble absolute bottom-3 right-3 z-30 p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/15 shadow-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center"
        title={isMuted ? "Unmute audio" : "Mute audio"}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-white/90" />
        ) : (
          <Volume2 className="w-4 h-4 text-pink-400" />
        )}
      </button>

      {/* Instagram-Style Subtle Overlay Controls (Visible on hover or when paused) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 pt-8 pb-1.5 px-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-white/90 mb-1.5 select-none">
          {/* Play/Pause & Time */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="no-tap-bubble p-1 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              )}
            </button>
            <span className="font-mono text-[11px] text-white/80 font-bold tracking-tight">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen Button */}
          <div className="flex items-center space-x-2 mr-11">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="no-tap-bubble p-1 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-white/90" />
              ) : (
                <Maximize className="w-3.5 h-3.5 text-white/90" />
              )}
            </button>
          </div>
        </div>

        {/* Sleek Progress Scrubber Bar */}
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="no-tap-bubble w-full h-1 hover:h-2 bg-white/25 rounded-full cursor-pointer relative overflow-hidden transition-all group/bar"
        >
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
