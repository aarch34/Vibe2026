"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Send, Sparkles, ArrowLeft, X, AlertCircle } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setErrorMsg(null);
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
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl("");
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!caption.trim() && !imageUrl.trim()) {
      setErrorMsg("Please provide a caption or select a photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl }),
      });

      if (res.ok) {
        router.push("/app");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Couldn't publish your post. Please try again.");
      }
    } catch {
      setErrorMsg("Network error publishing post.");
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
          className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
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

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">Caption / Message *</label>
          <textarea
            rows={4}
            placeholder="Introduce yourself to Rotaract District 3192! What are you most excited for at VIBE 2026?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-4 bg-secondary/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1 flex items-center space-x-1">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Upload Photo</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="post-page-file-upload"
          />

          <label
            htmlFor="post-page-file-upload"
            className="w-full py-3 px-4 bg-secondary/50 border border-dashed border-border hover:border-pink-500/60 rounded-xl text-xs font-bold text-muted-foreground hover:text-pink-400 transition-all flex items-center justify-center space-x-2 cursor-pointer block"
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
            <span>{imagePreview ? "Change Selected Photo" : "Choose Image File (Max 5MB)"}</span>
          </label>
        </div>

        {fileError && (
          <p className="text-xs text-red-400 font-bold flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{fileError}</span>
          </p>
        )}

        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 max-h-60 bg-black/40">
            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
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

        <button
          type="submit"
          disabled={isSubmitting || (!caption.trim() && !imageUrl.trim())}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <span>{isSubmitting ? "PUBLISHING..." : "PUBLISH POST"}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
