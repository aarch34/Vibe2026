"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Send, Sparkles, ArrowLeft, X, AlertCircle, Camera, Tag } from "lucide-react";

const VIBE_TAGS = ["#VIBE2026", "#Rotaract3192", "#FresherFestival", "#DistrictCouncil", "#Bengaluru", "#MeetTheDistrict"];

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image on the client before upload for speed and reliability
  const compressImage = (file: File): Promise<{ dataUrl: string; file: File }> => {
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
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File(
                    [blob],
                    file.name.replace(/\.[^/.]+$/, ".jpg"),
                    { type: "image/jpeg", lastModified: Date.now() }
                  );
                  resolve({
                    dataUrl: canvas.toDataURL("image/jpeg", 0.85),
                    file: compressedFile,
                  });
                } else {
                  resolve({ dataUrl: e.target?.result as string, file });
                }
              },
              "image/jpeg",
              0.85
            );
          } else {
            resolve({ dataUrl: e.target?.result as string, file });
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
    setErrorMsg(null);
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
      const { dataUrl, file: compressedFile } = await compressImage(file);
      setImagePreview(dataUrl);
      setSelectedFile(compressedFile);
    } catch {
      setFileError("Could not process image file. Please try another image.");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl("");
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
    }
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
      let finalImageUrl = imageUrl.trim() || null;
      if (selectedFile) {
        try {
          const form = new FormData();
          form.append("file", selectedFile);
          form.append("category", "posts");
          const upRes = await fetch("/api/media/upload", {
            method: "POST",
            body: form,
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData.url) {
              finalImageUrl = upData.url;
            }
          }
        } catch {
          // Fallback to existing imageUrl if direct upload network fails
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: caption.trim(), imageUrl: finalImageUrl }),
      });

      if (res.ok) {
        router.push("/app");
        router.refresh();
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
        <h1 className="text-xl font-black text-foreground font-mono uppercase tracking-tight">CREATE VIBE POST</h1>
        <div className="w-9" />
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 text-xs font-bold font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Earn +50 XP on your 1st post! ⭐</span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Caption Area */}
        <div>
          <label className="text-xs font-black uppercase text-muted-foreground block mb-1">
            Caption & Story *
          </label>
          <textarea
            rows={4}
            placeholder="Share your pre-VIBE moment with Rotaract District 3192! What are you most excited for?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-4 bg-secondary/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none leading-relaxed"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground block">Tap to add vibe tags:</span>
          <div className="flex flex-wrap gap-1.5">
            {VIBE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-secondary hover:bg-pink-500/20 text-muted-foreground hover:text-pink-400 border border-border/80 transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload Area */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-muted-foreground block flex items-center space-x-1">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Upload Photo / Moment</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="post-page-file-upload"
          />

          {!imagePreview ? (
            <label
              htmlFor="post-page-file-upload"
              className="w-full py-8 px-4 bg-secondary/40 border-2 border-dashed border-border hover:border-pink-500/60 rounded-2xl text-xs font-bold text-muted-foreground hover:text-pink-400 transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer block text-center"
            >
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Camera className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-foreground">Choose Photo from Gallery or Camera</span>
              <span className="text-[10px] text-muted-foreground">JPEG, PNG, WebP, GIF (Auto-optimized)</span>
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/40 bg-black/60 shadow-lg">
              <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain mx-auto" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-destructive text-white transition-all shadow-md cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {fileError && (
          <p className="text-xs text-destructive font-bold flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{fileError}</span>
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (!caption.trim() && !imageUrl.trim())}
          className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <span>{isSubmitting ? "PUBLISHING TO VIBE..." : "SHARE POST ON VIBE 🚀"}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
