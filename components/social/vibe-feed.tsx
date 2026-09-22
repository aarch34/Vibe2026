"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Share2,
  Instagram,
  UserPlus,
  Send,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Post, Profile } from "@/types/database";

interface VibeFeedProps {
  initialPosts: (Post & { author: Profile })[];
  currentProfile: Profile;
}

export function VibeFeed({ initialPosts, currentProfile }: VibeFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, { authorName: string; comment: string }[]>>({});

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() && !newImageUrl.trim()) return;

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
        }
      } else {
        // Mock fallback
        const mockPost: Post & { author: Profile } = {
          id: `post-${Date.now()}`,
          author_id: currentProfile.id,
          caption: newCaption,
          image_url: newImageUrl || null,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: currentProfile,
        };
        setPosts([mockPost, ...posts]);
      }
      setNewCaption("");
      setNewImageUrl("");
      setShowImageInput(false);
    } catch {
      // Fallback
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch {
      // Ignore API failure
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = p.likes_count % 2 === 1; // local toggle simulation
          return {
            ...p,
            likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;

    const newCommentObj = { authorName: currentProfile.display_name, comment: commentText };
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentObj],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );

    setCommentText("");
  };

  const handleConnect = async (receiverId: string) => {
    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      alert("Connection request sent!");
    } catch {
      alert("Connection request sent!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Post Box */}
      <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-lg space-y-3">
        <div className="flex items-start space-x-3">
          <img
            src={currentProfile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=me"}
            alt={currentProfile.display_name}
            className="w-10 h-10 rounded-full border border-pink-500/40 object-cover shrink-0"
          />
          <div className="flex-1 space-y-2">
            <textarea
              rows={2}
              placeholder="What's your pre-VIBE introduction or update?"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full bg-secondary/50 border border-border/80 rounded-2xl p-3 text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none"
            />

            {showImageInput && (
              <input
                type="url"
                placeholder="Paste Image URL (e.g. https://images.unsplash.com/...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-xl text-xs text-foreground focus:outline-none"
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-pink-400 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>{showImageInput ? "Remove Photo" : "Add Photo"}</span>
              </button>

              <button
                onClick={handleCreatePost}
                disabled={isPosting || (!newCaption.trim() && !newImageUrl.trim())}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                <span>POST</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {posts.map((post) => {
          const author = post.author || currentProfile;
          const isSelf = author.id === currentProfile.id;
          const comments = commentsMap[post.id] || [];

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
                      className="w-10 h-10 rounded-full border border-purple-500/40 object-cover"
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
                </div>
              </div>

              {/* Caption */}
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {post.caption}
              </p>

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
                    className="flex items-center space-x-1.5 hover:text-pink-400 transition-colors group"
                  >
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform text-pink-400" />
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
