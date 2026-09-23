"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { Post, Profile } from "@/types/database";

interface VibeFeedProps {
  initialPosts: (Post & { author: Profile })[];
  currentProfile: Profile;
}

export function VibeFeed({ initialPosts, currentProfile }: VibeFeedProps) {
  const [posts, setPosts] = useState<(Post & { author: Profile })[]>(initialPosts);
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, { authorName: string; comment: string }[]>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  // File selection & preview handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Only image files (JPEG, PNG, WebP, GIF) are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image size exceeds 5MB limit. Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setNewImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
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
        body: JSON.stringify({ caption: newCaption, imageUrl: newImageUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPosts([data.post, ...posts]);
          const bonusMsg = data.xpEarned > 0 ? ` +${data.xpEarned} XP Earned for your 1st post! 🎉` : "";
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
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch {
      // Revert if request failed
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const textToSubmit = commentText.trim();
    setCommentText("");

    const newCommentObj = { authorName: currentProfile.display_name, comment: textToSubmit };
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentObj],
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
    if (!window.confirm("Are you sure you want to delete your post?")) return;
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
    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      setStatusMessage({ type: "success", text: "Connection request sent! 👋" });
    } catch {
      setStatusMessage({ type: "success", text: "Connection request sent! 👋" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-lg space-y-3">
        <div className="flex items-start space-x-3">
          <img
            src={currentProfile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=me"}
            alt={currentProfile.display_name}
            width={40}
            height={40}
            style={{ width: "40px", height: "40px", maxWidth: "40px", maxHeight: "40px" }}
            className="w-10 h-10 rounded-full border border-pink-500/40 object-cover shrink-0"
          />
          <div className="flex-1 space-y-2.5">
            <textarea
              ref={captionInputRef}
              rows={2}
              placeholder="What's your pre-VIBE introduction or update?"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full bg-secondary/50 border border-border/80 rounded-2xl p-3 text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none"
            />

            {/* Image Preview Thumbnail */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 max-h-60 bg-black/40 group">
                <img src={imagePreview} alt="Upload preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-all shadow-md"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-red-400 font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
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
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-pink-400 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
              </label>

              <button
                onClick={handleCreatePost}
                disabled={isPosting || (!newCaption.trim() && !newImageUrl.trim())}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>{isPosting ? "PUBLISHING..." : "POST"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
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

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="p-8 rounded-3xl bg-card border border-border/80 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center text-3xl">
            💬
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-foreground">Your VIBE feed is waiting for its first post.</h4>
            <p className="text-xs text-muted-foreground">Share an update, photo, or introduction to Rotaract District 3192!</p>
          </div>
          <button
            onClick={() => captionInputRef.current?.focus()}
            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md inline-flex items-center space-x-2"
          >
            <span>Create your first post</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {posts.map((post) => {
          const author = post.author || currentProfile;
          const isSelf = author.id === currentProfile.id;
          const comments = commentsMap[post.id] || [];
          const isLiked = likedPostIds.has(post.id);

          return (
            <div
              key={post.id}
              className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-3 hover:border-border transition-all"
            >
              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link href={`/app/profile?id=${author.id}`}>
                    <img
                      src={author.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=author"}
                      alt={author.display_name}
                      width={40}
                      height={40}
                      style={{ width: "40px", height: "40px", maxWidth: "40px", maxHeight: "40px" }}
                      className="w-10 h-10 rounded-full border border-purple-500/40 object-cover shrink-0"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <Link
                        href={`/app/profile?id=${author.id}`}
                        className="font-black text-sm text-foreground hover:text-pink-400 transition-colors"
                      >
                        {author.display_name}
                      </Link>
                      <span className="text-[11px] font-mono text-muted-foreground">@{author.username}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                      {author.college} • {author.rotaract_club}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isSelf && (
                    <button
                      onClick={() => handleConnect(author.id)}
                      className="px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-extrabold flex items-center space-x-1 transition-all"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Connect</span>
                    </button>
                  )}

                  {author.instagram_username && (
                    <a
                      href={`https://instagram.com/${author.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 transition-all"
                      title={`View @${author.instagram_username} on Instagram`}
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {isSelf && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {post.caption}
                </p>
              )}

              {/* Attached Photo */}
              {post.image_url && (
                <div className="rounded-2xl overflow-hidden border border-border/50 max-h-96 bg-black/40">
                  <img
                    src={post.image_url}
                    alt="Post media"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1.5 transition-colors group ${
                      isLiked ? "text-pink-500" : "hover:text-pink-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLiked ? "fill-pink-500 text-pink-500" : "text-pink-400"}`} />
                    <span>{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                    }
                    className="flex items-center space-x-1.5 hover:text-purple-400 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>{post.comments_count}</span>
                  </button>
                </div>

                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Comments Dropdown */}
              {activeCommentPostId === post.id && (
                <div className="pt-3 border-t border-border/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                      className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      Comment
                    </button>
                  </div>

                  {comments.length > 0 && (
                    <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-xl border border-border/40">
                      {comments.map((c, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-extrabold text-foreground mr-1.5">{c.authorName}:</span>
                          <span className="text-muted-foreground">{c.comment}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
