"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Send, Sparkles, ArrowLeft } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !imageUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl }),
      });
      router.push("/app");
    } catch {
      router.push("/app");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-foreground">CREATE VIBE POST</h1>
        <div className="w-9" />
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Earn +50 XP on your 1st post!</span>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">Caption / Message *</label>
          <textarea
            rows={4}
            required
            placeholder="Introduce yourself to Rotaract District 3192! What are you most excited for at VIBE 2026?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-4 bg-secondary/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center space-x-1">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Photo URL (Optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
          />
        </div>

        {imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-border/50 max-h-60 bg-black/40">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (!caption.trim() && !imageUrl.trim())}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>PUBLISH POST</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
