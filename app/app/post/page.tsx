"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  Sparkles,
  ArrowLeft,
  X,
  AlertCircle,
  Camera,
  Play,
  UploadCloud,
} from "lucide-react";
import { uploadMediaWithProgress } from "@/lib/storage/upload-with-progress";

const VIBE_TAGS = [
  "#VIBE2026",
  "#Rotaract3192",
  "#FresherFestival",
  "#DistrictCouncil",
  "#Bengaluru",
  "#MeetTheDistrict",
];

const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024; // 50MB strictly enforced

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState<{ loadedMb: string; totalMb: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const objUrl = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objUrl);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error("Unable to read video duration"));
      };
      video.src = objUrl;
    });
  };

  // Clean up Object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (mediaPreview && mediaPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(mediaPreview);
        } catch {}
      }
    };
  }, [mediaPreview]);

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

    const isVid = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);
    const isImg = file.type.startsWith("image/");

    if (!isVid && !isImg) {
      setFileError("Only photos (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV) are allowed.");
      return;
    }

    // Strict 50MB check for all media, especially videos
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(
        isVid
          ? `Video size exceeds the 50MB limit (${sizeMb}MB). Videos must be 50MB or less.`
          : `Photo size exceeds the 50MB limit (${sizeMb}MB). Please select a file under 50MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (isVid) {
      // Strict 60 seconds duration limit
      try {
        const duration = await checkVideoDuration(file);
        if (duration > 60.5) {
          setFileError(
            `Video duration exceeds the 60-second limit (${Math.round(duration)} seconds). Please trim or choose a video of 60 seconds or less.`
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setVideoDuration(Math.round(duration));
      } catch (err) {
        console.warn("Could not read video duration:", err);
      }

      setIsVideo(true);
      const videoObjectUrl = URL.createObjectURL(file);
      setMediaPreview(videoObjectUrl);
      setSelectedFile(file);
    } else {
      setIsVideo(false);
      try {
        if (file.size > 2 * 1024 * 1024) {
          const { dataUrl, file: compressedFile } = await compressImage(file);
          setMediaPreview(dataUrl);
          setSelectedFile(compressedFile);
        } else {
          const reader = new FileReader();
          reader.onload = (re) => setMediaPreview(re.target?.result as string);
          reader.readAsDataURL(file);
          setSelectedFile(file);
        }
      } catch {
        setFileError("Could not process photo file. Please try another image.");
      }
    }
  };

  const removeMedia = () => {
    if (mediaPreview && mediaPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(mediaPreview);
      } catch {}
    }
    setMediaPreview(null);
    setImageUrl("");
    setSelectedFile(null);
    setIsVideo(false);
    setVideoDuration(null);
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

    if (!caption.trim() && !imageUrl.trim() && !selectedFile) {
      setErrorMsg("Please provide a caption or attach a photo/video.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStats(null);
    try {
      let finalMediaUrl = imageUrl.trim() || null;

      // Upload directly to Supabase Storage with real-time byte progress
      if (selectedFile) {
        try {
          const upData = await uploadMediaWithProgress(
            selectedFile,
            "posts",
            (prog) => {
              setUploadProgress(prog.percent);
              setUploadStats({ loadedMb: prog.loadedMb, totalMb: prog.totalMb });
            }
          );
          finalMediaUrl = upData.url;
          setUploadProgress(100);
        } catch (uploadErr: any) {
          setErrorMsg(uploadErr.message || "Failed to upload your media file.");
          setIsSubmitting(false);
          setUploadProgress(null);
          setUploadStats(null);
          return;
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: caption.trim(), imageUrl: finalMediaUrl }),
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
      setUploadProgress(null);
      setUploadStats(null);
    }
  };

  const fileSizeMb = selectedFile
    ? (selectedFile.size / (1024 * 1024)).toFixed(1)
    : null;

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
        <h1 className="text-xl font-black text-foreground font-mono uppercase tracking-tight">
          CREATE VIBE POST
        </h1>
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
            placeholder="Share your VIBE moment with Rotaract District 3192! What are you most excited for?"
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

        {/* Media Upload Area (Photo or Video up to 50MB) */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-muted-foreground block flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Attach Photo or Video</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono font-normal">
              Max 50MB (Supabase Storage)
            </span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,video/mov,video/x-m4v"
            onChange={handleFileChange}
            className="hidden"
            id="post-page-file-upload"
          />

          {!mediaPreview ? (
            <label
              htmlFor="post-page-file-upload"
              className="w-full py-8 px-4 bg-secondary/40 border-2 border-dashed border-border hover:border-pink-500/60 rounded-2xl text-xs font-bold text-muted-foreground hover:text-pink-400 transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer block text-center"
            >
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <VideoIcon className="w-6 h-6" />
                </div>
              </div>
              <span className="font-extrabold text-foreground">
                Choose Photo or Video from Gallery
              </span>
              <span className="text-[10px] text-muted-foreground">
                Photos (JPEG, PNG, WebP) • Videos (MP4, WebM, MOV up to 50MB)
              </span>
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/40 bg-black shadow-lg">
              {isVideo ? (
                <div className="relative bg-black flex items-center justify-center">
                  <video
                    src={mediaPreview}
                    controls
                    playsInline
                    className="w-full max-h-72 object-contain mx-auto"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-[10px] font-mono font-bold flex items-center space-x-1 backdrop-blur-sm shadow">
                    <VideoIcon className="w-3 h-3" />
                    <span>Video • {videoDuration ? `${videoDuration}s (Max 60s)` : "Max 60s"} • {fileSizeMb}MB / 50MB</span>
                  </div>
                </div>
              ) : (
                <div className="relative bg-black flex items-center justify-center">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-72 object-contain mx-auto"
                  />
                  {fileSizeMb && (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-pink-600/90 text-white text-[10px] font-mono font-bold flex items-center space-x-1 backdrop-blur-sm">
                      <ImageIcon className="w-3 h-3" />
                      <span>Photo • {fileSizeMb}MB</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={removeMedia}
                disabled={isSubmitting}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-destructive text-white transition-all shadow-md cursor-pointer z-10 disabled:opacity-50"
                title="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Real-time Media Upload Progress Bar */}
          {isSubmitting && uploadProgress !== null && (
            <div className="p-4 rounded-2xl bg-secondary/80 border border-pink-500/40 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <div className="flex items-center space-x-2 text-pink-400">
                  <UploadCloud className="w-4 h-4 animate-bounce text-pink-400 shrink-0" />
                  <span>
                    {uploadProgress < 100
                      ? isVideo
                        ? "Uploading Video to Storage..."
                        : "Uploading Photo..."
                      : "Processing & Publishing..."}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-foreground font-black text-xs font-mono">
                    {uploadProgress}%
                  </span>
                  {uploadStats && (
                    <span className="text-muted-foreground text-[10px] ml-1.5 font-normal">
                      ({uploadStats.loadedMb}MB / {uploadStats.totalMb}MB)
                    </span>
                  )}
                </div>
              </div>

              {/* Animated Gradient Progress Track */}
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-pink-500/30 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(236,72,153,0.7)]"
                  style={{ width: `${Math.max(4, uploadProgress)}%` }}
                />
              </div>
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
          disabled={isSubmitting || (!caption.trim() && !imageUrl.trim() && !selectedFile)}
          className="relative overflow-hidden w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer text-white border border-pink-500/30"
        >
          {/* Background: Progress fill during upload, gradient when idle */}
          {isSubmitting && uploadProgress !== null ? (
            <>
              <div className="absolute inset-0 bg-secondary/90" />
              <div
                className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 transition-all duration-150 ease-out opacity-90"
                style={{ width: `${Math.max(6, uploadProgress)}%` }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 active:scale-[0.99]" />
          )}

          {/* Content */}
          <div className="relative z-10 flex items-center space-x-2 drop-shadow">
            {isSubmitting ? (
              <>
                <UploadCloud className="w-4 h-4 animate-bounce shrink-0" />
                <span className="font-mono font-black">
                  {uploadProgress !== null && uploadProgress < 100
                    ? `UPLOADING ${uploadProgress}% ${uploadStats ? `(${uploadStats.loadedMb}MB / ${uploadStats.totalMb}MB)` : ""}`
                    : "FINALIZING POST..."}
                </span>
              </>
            ) : (
              <>
                <span>SHARE POST ON VIBE 🚀</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
}
