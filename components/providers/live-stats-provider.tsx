"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification, ConnectionRequest, Profile } from "@/types/database";

interface LiveStatsContextType {
  xp: number;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  incomingRequests: { request: ConnectionRequest; sender?: Profile }[];
  setIncomingRequests: React.Dispatch<React.SetStateAction<{ request: ConnectionRequest; sender?: Profile }[]>>;
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

  useEffect(() => {
    let isMounted = true;
    const fetchFreshData = async () => {
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
          }
        }
      } catch {
        // silently ignore
      }
    };

    // Fetch once on mount to get initial dynamic data (like incoming requests)
    fetchFreshData();
    
    return () => {
      isMounted = false;
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
