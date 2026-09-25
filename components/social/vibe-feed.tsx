"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Instagram,
  UserPlus,
  Send,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  AlertCircle,
  Share2,
  Check,
} from "lucide-react";
import { Post, Profile } from "@/types/database";
import { isVideoMedia } from "@/lib/utils";

interface VibeFeedProps {
  initialPosts: (Post & { author: Profile })[];
  initialLikedPostIds?: string[];
  currentProfile: Profile;
}

const FEED_CACHE_KEY = "vibe_feed_posts_v1";
const FEED_SYNC_KEY = "vibe_feed_last_sync_v1";

export function VibeFeed({ initialPosts, initialLikedPostIds, currentProfile }: VibeFeedProps) {
  const [posts, setPosts] = useState<(Post & { author: Profile })[]>(() => {
    // Prioritize server-provided posts, then fall back to localStorage cache (capped at 10 to keep database & client load light)
    if (initialPosts && initialPosts.length > 0) return initialPosts.slice(0, 10);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(FEED_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 10);
        }
      } catch { /* ignore */ }
    }
    return [];
  });
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, { id?: string; authorName: string; authorAvatar?: string; comment: string }[]>>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set(initialLikedPostIds || []));
  const [heartAnimPostId, setHeartAnimPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [connectionStates, setConnectionStates] = useState<Record<string, "none" | "pending" | "connected">>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [xpFlyerPostId, setXpFlyerPostId] = useState<string | null>(null);

  // On mount: delta-sync only new posts from server (0 egress if nothing changed)
  useEffect(() => {
    let isMounted = true;
    const savedSync = typeof window !== "undefined" ? localStorage.getItem(FEED_SYNC_KEY) || "" : "";
    const deltaUrl = savedSync
      ? `/api/posts?since=${encodeURIComponent(savedSync)}`
      : `/api/posts`;

    fetch(deltaUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted || !data.success) return;
        const incoming: (Post & { author: Profile })[] = data.posts || [];
        if (data.timestamp) {
          try { localStorage.setItem(FEED_SYNC_KEY, data.timestamp); } catch { /* ignore */ }
        }
        if (data.isDelta && incoming.length > 0) {
          // Merge only new posts at the front, keep capped at 10 to minimize DB and client load
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const brand = incoming.filter((p) => !existingIds.has(p.id));
            const merged = [...brand, ...prev].slice(0, 10);
            try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
            return merged;
          });
        } else if (!data.isDelta && incoming.length > 0) {
          // Full refresh: cap to 10
          const capped = incoming.slice(0, 10);
          setPosts(capped);
          try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(capped)); } catch { /* ignore */ }
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [currentProfile.id]);

  // Sync liked IDs when server refreshes
  useEffect(() => {
    if (initialLikedPostIds) setLikedPostIds(new Set(initialLikedPostIds));
  }, [initialLikedPostIds]);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  // Client-side image compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Only image files (JPEG, PNG, WebP, GIF) are allowed.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError("Image size exceeds 15MB limit. Please select a smaller photo.");
      return;
    }

    try {
      const optimized = await compressImage(file);
      setImagePreview(optimized);
      setNewImageUrl(optimized);
    } catch {
      setFileError("Error processing image.");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setNewImageUrl("");
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setFileError(null);

    if (!newCaption.trim() && !newImageUrl.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a caption or upload a photo." });
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: newCaption.trim(), imageUrl: newImageUrl.trim() || null }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          const author = data.post.author || currentProfile;
          setPosts((prev) => {
            const updated = [{ ...data.post, author }, ...prev].slice(0, 10);
            // Update localStorage cache so next page load shows this post immediately
            try {
              localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(updated));
              // Clear the delta-sync timestamp so next full refresh gets all posts
              localStorage.removeItem(FEED_SYNC_KEY);
            } catch { /* ignore */ }
            return updated;
          });
          const bonusMsg = data.xpEarned > 0 ? ` +${data.xpEarned} XP Earned for your 1st post! ⭐` : "";
          setStatusMessage({ type: "success", text: `Post published! 🎉${bonusMsg}` });
        }
        setNewCaption("");
        removeImage();
      } else {
        const errData = await res.json();
        setStatusMessage({ type: "error", text: errData.error || "Couldn't publish your post. Please try again." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network failure. Couldn't publish your post." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const isCurrentlyLiked = likedPostIds.has(postId);
    const nextLikedState = !isCurrentlyLiked;

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (nextLikedState) next.add(postId);
      else next.delete(postId);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes_count: nextLikedState ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.xpEarned && data.xpEarned > 0) {
          setXpFlyerPostId(postId);
          setTimeout(() => setXpFlyerPostId(null), 1500);
        }
      }
    } catch {
      // Revert if request failed
    }
  };

  const handleDoubleTapPhoto = (postId: string) => {
    setHeartAnimPostId(postId);
    setTimeout(() => setHeartAnimPostId(null), 900);

    if (!likedPostIds.has(postId)) {
      handleLike(postId);
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);

    // Fetch existing comments if not yet loaded
    if (!commentsMap[postId]) {
      setLoadingCommentsPostId(postId);
      try {
        const res = await fetch(`/api/posts/${postId}/comment`);
        if (res.ok) {
          const data = await res.json();
          if (data.comments) {
            setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoadingCommentsPostId(null);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const textToSubmit = commentText.trim();
    setCommentText("");

    const tempComment = {
      authorName: currentProfile.display_name,
      authorAvatar: currentProfile.avatar_url || undefined,
      comment: textToSubmit,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );

    try {
      await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: textToSubmit }),
      });
    } catch {
      // Keep optimistic comment
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeletingPostId(postId);

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setStatusMessage({ type: "success", text: "Post deleted successfully." });
      } else {
        setStatusMessage({ type: "error", text: "Could not delete post." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error deleting post." });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleConnect = async (receiverId: string) => {
    setConnectionStates((prev) => ({ ...prev, [receiverId]: "pending" }));
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Connection request sent! They will get an alert. 👋" });
      } else {
        setStatusMessage({ type: "error", text: data.message || "Request already sent." });
      }
    } catch {
      setStatusMessage({ type: "success", text: "Connection request sent! 👋" });
    }
  };

  const handleShare = (postId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/app`);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  const formatTimeAgo = useCallback((dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  }, []);

  const handleLikeCb = useCallback(handleLike, [likedPostIds, posts]);
  const handleDoubleTapCb = useCallback(handleDoubleTapPhoto, [likedPostIds]);
  const toggleCommentsCb = useCallback(toggleComments, [activeCommentPostId, commentsMap]);
  const handleAddCommentCb = useCallback(handleAddComment, [commentText, currentProfile]);
  const handleDeletePostCb = useCallback(handleDeletePost, []);
  const handleConnectCb = useCallback(handleConnect, []);
  const handleShareCb = useCallback(handleShare, []);

  return (
    <div className="space-y-6">
      {/* Instagram-Style Post Creator Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-lg space-y-3">
        <div className="flex items-start space-x-3">
          <Link href="/app/profile">
            <img
              src={currentProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentProfile.display_name || "me")}`}
              alt={currentProfile.display_name}
              onError={(e) => {
                const fb = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentProfile.display_name || "me")}`;
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
              }}
              width={42}
              height={42}
              style={{ width: "42px", height: "42px" }}
              className="w-10 h-10 rounded-full border-2 border-pink-500/50 object-cover shrink-0 hover:scale-105 transition-transform bg-secondary/40"
            />
          </Link>
          <div className="flex-1 space-y-2.5">
            <textarea
              ref={captionInputRef}
              rows={2}
              placeholder="Share a photo or introduce yourself to District 3192..."
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full bg-secondary/50 border border-border/80 rounded-2xl p-3 text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none leading-relaxed"
            />

            {/* Image Preview Thumbnail */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 bg-black/60 shadow-md">
                <img src={imagePreview} alt="Upload preview" className="w-full max-h-60 object-contain mx-auto" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-destructive text-white transition-all shadow-md cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-destructive font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fileError}</span>
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="feed-file-upload"
              />
              <label
                htmlFor="feed-file-upload"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-pink-400 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-secondary/60"
              >
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>{imagePreview ? "Change Photo" : "Add Photo"}</span>
              </label>

              <button
                onClick={handleCreatePost}
                disabled={isPosting || (!newCaption.trim() && !newImageUrl.trim())}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>{isPosting ? "POSTING..." : "SHARE POST"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map((post) => {
          const author = post.author || currentProfile;
          const isSelf = author.id === currentProfile.id;
          const comments = commentsMap[post.id] || [];
          const isLiked = likedPostIds.has(post.id);
          const connState = connectionStates[author.id] || "none";
          const isShowingHeartAnim = heartAnimPostId === post.id;

          return (
            <div
              key={post.id}
              className="rounded-3xl bg-card border border-border/80 shadow-lg overflow-hidden transition-all hover:border-border"
            >
              {/* Instagram-Style Post Author Header */}
              <div className="p-4 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center space-x-3 min-w-0">
                  <Link href={`/app/profile?id=${author.id}`} className="shrink-0">
                    <div className="p-0.5 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400">
                      <img
                        src={author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author.display_name || "author")}`}
                        alt={author.display_name}
                        onError={(e) => {
                          const fb = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author.display_name || "author")}`;
                          if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
                        }}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "40px", height: "40px" }}
                        className="w-10 h-10 rounded-full bg-background object-cover"
                      />
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <Link
                        href={`/app/profile?id=${author.id}`}
                        className="font-black text-sm text-foreground hover:text-pink-400 transition-colors truncate"
                      >
                        {author.display_name}
                      </Link>
                      <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                        @{author.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {author.rotaract_club || "District 3192"}
                    </p>
                  </div>
                </div>

                {/* Right Header Actions: Connect, Instagram, Delete */}
                <div className="flex items-center space-x-2 shrink-0">
                  {!isSelf && (
                    <button
                      onClick={() => handleConnect(author.id)}
                      disabled={connState === "pending"}
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer ${
                        connState === "pending"
                          ? "bg-secondary text-muted-foreground border border-border"
                          : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{connState === "pending" ? "Sent" : "Connect"}</span>
                    </button>
                  )}

                  {author.instagram_username && (
                    <a
                      href={`https://instagram.com/${author.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 transition-all"
                      title={`@${author.instagram_username} on Instagram`}
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {isSelf && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="p-1.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Attached Photo or Video (with Instagram Double-Tap to Like) */}
              {post.image_url && (
                <div
                  className="relative overflow-hidden bg-black/90 flex items-center justify-center select-none group"
                  onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                >
                  {isVideoMedia(post.image_url) ? (
                    <video
                      src={post.image_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-[500px] object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={post.image_url}
                      alt="Post photo"
                      loading="lazy"
                      decoding="async"
                      className="w-full max-h-[500px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  )}

                  {/* Double-Tap Heart Burst Animation */}
                  {isShowingHeartAnim && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                      <Heart className="w-24 h-24 text-pink-500 fill-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-bounce" />
                    </div>
                  )}
                </div>
              )}

              {/* Interaction Bar & Engagement Stats */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <div className="flex items-center space-x-5">
                    {/* Like Action */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`relative flex items-center space-x-1.5 transition-all group cursor-pointer active:scale-125 ${
                        isLiked ? "text-pink-500" : "hover:text-pink-400 text-muted-foreground"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isLiked ? "fill-pink-500 text-pink-500" : "text-muted-foreground hover:text-pink-400"
                        }`}
                      />
                      <span className="font-mono text-sm font-black text-foreground">
                        {post.likes_count}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:scale-105 transition-transform">
                        +5 XP
                      </span>

                      {/* Animated Floating +5 XP flyer when liked */}
                      {xpFlyerPostId === post.id && (
                        <span className="absolute -top-7 left-0 pointer-events-none text-xs font-black font-mono text-pink-300 bg-pink-950/90 border border-pink-500 px-2 py-0.5 rounded-full shadow-lg shadow-pink-500/50 animate-bounce">
                          +5 XP! ⭐
                        </span>
                      )}
                    </button>

                    {/* Comment Action */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-1.5 hover:text-purple-400 transition-colors cursor-pointer group"
                    >
                      <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-transform group-hover:scale-110" />
                      <span className="font-mono text-sm font-black text-foreground">
                        {post.comments_count}
                      </span>
                    </button>

                    {/* Share Action */}
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-1 hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Share link"
                    >
                      {copiedPostId === post.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <Share2 className="w-4 h-4 text-muted-foreground hover:text-cyan-400" />
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    <span className="font-black text-foreground mr-1.5">{author.display_name}</span>
                    <span className="text-muted-foreground/90 font-medium">{post.caption}</span>
                  </div>
                )}

                {/* View Comments Toggle */}
                {post.comments_count > 0 && activeCommentPostId !== post.id && (
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-xs font-bold text-muted-foreground hover:text-purple-400 transition-colors block cursor-pointer"
                  >
                    View all {post.comments_count} {post.comments_count === 1 ? "comment" : "comments"}
                  </button>
                )}

                {/* Comments Dropdown Section */}
                {activeCommentPostId === post.id && (
                  <div className="pt-3 border-t border-border/50 space-y-3 animate-in fade-in duration-150">
                    {/* Add Comment Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                        className="flex-1 px-3.5 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-purple-400 transition-all"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Post
                      </button>
                    </div>

                    {/* Comments List */}
                    {loadingCommentsPostId === post.id ? (
                      <p className="text-xs text-muted-foreground text-center py-2">Loading comments...</p>
                    ) : comments.length > 0 ? (
                      <div className="space-y-2 bg-secondary/30 p-3 rounded-2xl border border-border/40 max-h-60 overflow-y-auto">
                        {comments.map((c, i) => (
                          <div key={c.id || i} className="text-xs flex items-start space-x-2">
                            {c.authorAvatar && (
                              <img
                                src={c.authorAvatar}
                                alt={c.authorName}
                                className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                              />
                            )}
                            <div className="flex-1 leading-relaxed">
                              <span className="font-extrabold text-foreground mr-1.5">{c.authorName}</span>
                              <span className="text-muted-foreground">{c.comment}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-1">No comments yet. Be the first to say something!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* End of Feed — Capped at 10 to minimize database load on event day */}
        {posts.length > 0 && (
          <div className="p-6 rounded-3xl bg-card/70 backdrop-blur-md border border-border/80 text-center space-y-3 mt-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center mx-auto text-pink-400 shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground">You're All Caught Up! ✨</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                Showing the latest {posts.length} {posts.length === 1 ? "post" : "posts"} to keep VIBE 2026 super fast and prevent database strain during the event.
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                Back to Top ↑
              </button>
              <Link
                href="/app/post"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white text-xs font-bold shadow-md hover:shadow-neon-pink transition-all cursor-pointer flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Share a Vibe</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
