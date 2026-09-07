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
