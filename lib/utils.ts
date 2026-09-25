import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export function formatXP(xp: number): string {
  return new Intl.NumberFormat("en-IN").format(xp) + " XP";
}

export function truncateAddress(id: string, startChars = 6, endChars = 4): string {
  if (!id || id.length <= startChars + endChars) return id;
  return `${id.slice(0, startChars)}...${id.slice(-endChars)}`;
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  return (
    /\.(mp4|webm|mov|m4v|ogg|3gp)(\?.*)?$/i.test(url) ||
    url.startsWith("data:video/") ||
    url.includes("/videos/") ||
    url.includes("format=video")
  );
}

