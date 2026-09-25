"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { Post, Profile } from "@/types/database";
import { isVideoMedia } from "@/lib/utils";

export default function AdminSocialPage() {
  const [postsList, setPostsList] = useState<(Post & { profile: Profile })[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setPostsList(data.posts || []);
      }
    } catch {}
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-pink-400" />
            <h1 className="text-2xl font-black text-foreground">SOCIAL FEED MODERATION</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Review and moderate all social posts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {postsList.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground bg-card rounded-3xl border border-border border-dashed">
            No posts found on the platform.
          </div>
        ) : (
          postsList.map((post) => (
            <div key={post.id} className="p-4 rounded-3xl bg-card border border-border shadow-sm space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0 relative">
                    {post.profile?.avatar_url ? (
                      <img src={post.profile.avatar_url} alt={post.profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                        {post.profile?.display_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{post.profile?.display_name || "Unknown"}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-foreground flex-1">
                {post.caption}
              </div>
              
              {post.image_url && (
                <div className="w-full h-48 bg-black rounded-xl overflow-hidden relative mt-2 flex items-center justify-center">
                  {isVideoMedia(post.image_url) ? (
                    <video
                      src={post.image_url}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img src={post.image_url} alt="Post image" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4 pt-2 border-t border-border/50 text-xs font-bold text-muted-foreground">
                <span>❤️ {post.likes_count}</span>
                <span>💬 {post.comments_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
