"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification, ConnectionRequest, Profile } from "@/types/database";

export interface LatestPostInfo {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  caption: string;
  image_url?: string | null;
  created_at: string;
}

interface LiveStatsContextType {
  xp: number;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  incomingRequests: { request: ConnectionRequest; sender?: Profile }[];
  setIncomingRequests: React.Dispatch<React.SetStateAction<{ request: ConnectionRequest; sender?: Profile }[]>>;
  latestPost: LatestPostInfo | null;
}

const LiveStatsContext = createContext<LiveStatsContextType | undefined>(undefined);

export function LiveStatsProvider({
  children,
  initialXp,
  initialNotifications,
}: {
  children: React.ReactNode;
  initialXp: number;
  initialNotifications: Notification[];
}) {
  const [xp, setXp] = useState(initialXp);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [incomingRequests, setIncomingRequests] = useState<{ request: ConnectionRequest; sender?: Profile }[]>([]);
  const [latestPost, setLatestPost] = useState<LatestPostInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const fetchFreshData = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setNotifications(data.notifications || []);
            if (data.currentXp !== undefined) {
              setXp(data.currentXp);
            }
            if (data.incomingRequests) {
              setIncomingRequests(data.incomingRequests);
            }
            if (data.latestPost) {
              setLatestPost(data.latestPost);
            }
          }
        }
      } catch {
        // silently ignore
      } finally {
        isFetching = false;
      }
    };

    // 1. Initial immediate fetch
    fetchFreshData();

    // 2. Fast live polling every 3.5s while attendee is active
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchFreshData();
      }
    }, 3500);

    // 3. Immediately re-fetch when attendee focuses or switches back to tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchFreshData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  return (
    <LiveStatsContext.Provider
      value={{
        xp,
        setXp,
        notifications,
        setNotifications,
        incomingRequests,
        setIncomingRequests,
        latestPost,
      }}
    >
      {children}
    </LiveStatsContext.Provider>
  );
}

export function useLiveStats() {
  const context = useContext(LiveStatsContext);
  if (!context) {
    throw new Error("useLiveStats must be used within a LiveStatsProvider");
  }
  return context;
}
