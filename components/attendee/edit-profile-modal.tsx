"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  User,
  AtSign,
  Instagram,
  GraduationCap,
  Building,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Heart,
  Wrench,
} from "lucide-react";
import { Profile } from "@/types/database";
import { updateAttendeeProfile } from "@/actions/profile/update-profile";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onProfileUpdated?: (updated: Profile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const router = useRouter();

  // Form State initialized directly from current profile data (NO blank/demo data)
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [instagram, setInstagram] = useState(profile.instagram_username || "");
  const [college, setCollege] = useState(profile.college || "");
  const [courseYear, setCourseYear] = useState(profile.course_year || "");
  const [rotaractClub, setRotaractClub] = useState(profile.rotaract_club || "");
  const [city, setCity] = useState(profile.city || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [interests, setInterests] = useState(
    profile.interests ? profile.interests.join(", ") : ""
  );
  const [skills, setSkills] = useState(
    profile.skills ? profile.skills.join(", ") : ""
  );
  const [hobbies, setHobbies] = useState(
    profile.hobbies ? profile.hobbies.join(", ") : ""
  );

  // Photo & Upload state
  const [avatarPreview, setAvatarPreview] = useState<string>(
    profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.display_name || "user")}`
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setInstagram(profile.instagram_username || "");
      setCollege(profile.college || "");
      setCourseYear(profile.course_year || "");
      setRotaractClub(profile.rotaract_club || "");
      setCity(profile.city || "");
      setBio(profile.bio || "");
      setInterests(profile.interests ? profile.interests.join(", ") : "");
      setSkills(profile.skills ? profile.skills.join(", ") : "");
      setHobbies(profile.hobbies ? profile.hobbies.join(", ") : "");
      setAvatarPreview(
        profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.display_name || "user")}`
      );
      setAvatarFile(null);
      setPhotoError(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files (JPEG, PNG, WebP, GIF, AVIF) are permitted.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo exceeds 5MB size limit. Please choose a smaller photo.");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || "user")}`;
    setAvatarPreview(fallbackUrl);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic client validation
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrorMsg("Full Name is required (at least 2 characters).");
      return;
    }

    if (!username.trim()) {
      setErrorMsg("Username is required.");
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]+$/.test(cleanUser) || cleanUser.length < 2 || cleanUser.length > 30) {
      setErrorMsg("Username must be 2-30 characters with only letters, numbers, underscores, and dots.");
      return;
    }

    if (bio.trim().length > 500) {
      setErrorMsg("Bio cannot exceed 500 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("display_name", displayName.trim());
      formData.set("username", cleanUser);
      formData.set("college", college.trim());
      formData.set("course_year", courseYear.trim());
      formData.set("rotaract_club", rotaractClub.trim());
      formData.set("city", city.trim());
      formData.set("bio", bio.trim());
      formData.set("instagram_username", instagram.trim());
      formData.set("interests", interests.trim());
      formData.set("skills", skills.trim());
      formData.set("hobbies", hobbies.trim());

      if (avatarFile) {
        formData.set("avatar_file", avatarFile);
      } else {
        formData.set("avatar_url", avatarPreview);
      }

      const res = await updateAttendeeProfile(formData);

      if (res.success && res.profile) {
        setSuccessMsg("Profile updated successfully!");
        if (onProfileUpdated) {
          onProfileUpdated(res.profile);
        }
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || "Couldn't update your profile. Please try again.");
      }
    } catch {
      setErrorMsg("Couldn't update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-card border border-border/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                EDIT PROFILE
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Update your personal information & VIBE presence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center space-x-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-pink-500/50 object-cover shadow-lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-md transition-all cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div>
                <span className="font-extrabold text-foreground text-xs block">Profile Photo</span>
                <span className="text-[11px] text-muted-foreground">
                  Upload JPEG, PNG, WebP or GIF (Max 5MB)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="edit-profile-avatar-input"
              />

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 font-bold text-[11px] transition-all cursor-pointer"
                >
                  Choose New Photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground font-bold text-[11px] transition-all cursor-pointer"
                  >
                    Reset Avatar
                  </button>
                )}
              </div>

              {photoError && (
                <p className="text-[11px] text-red-400 font-semibold">{photoError}</p>
              )}
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-pink-400" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Username *</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                placeholder="e.g. john_vibe"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-mono font-medium focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Instagram Handle */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
              <Instagram className="w-3.5 h-3.5 text-purple-400" />
              <span>Instagram Username</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-muted-foreground font-mono font-bold">@</span>
              <input
                type="text"
                value={instagram.replace(/^@/, "")}
                onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                placeholder="username (without @ or link)"
                className="w-full p-3 pl-8 bg-secondary/40 border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-purple-400 transition-all"
              />
            </div>
          </div>

          {/* College & Course/Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>College / Institution</span>
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. RVCE / BMSCE"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Course / Year</span>
              </label>
              <input
                type="text"
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value)}
                placeholder="e.g. CS • 3rd Year"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Rotaract Club & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rotaract Club</span>
              </label>
              <input
                type="text"
                value={rotaractClub}
                onChange={(e) => setRotaractClub(e.target.value)}
                placeholder="e.g. RC Bangalore Central"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>City</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-rose-400 transition-all"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-muted-foreground">Bio / About You</label>
              <span className={`text-[10px] font-mono ${bio.length > 500 ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
                {bio.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other delegates about your interests, passions, and excitement for VIBE 2026..."
              className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-pink-500 transition-all resize-none"
            />
          </div>

          {/* Interests */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Interests (Comma-separated)</span>
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Fellowship, Networking, Music, Tech"
              className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* Skills & Hobbies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>Skills (Comma-separated)</span>
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Design, Public Speaking"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span>Hobbies (Comma-separated)</span>
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g. Photography, Travelling"
                className="w-full p-3 bg-secondary/40 border border-border rounded-xl text-foreground focus:outline-none focus:border-pink-400 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:brightness-110 text-white font-black text-xs shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
