"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/db/supabase";

interface RealtimeNotifierProps {
  currentProfileId: string | undefined;
}

export function RealtimeNotifier({ currentProfileId }: RealtimeNotifierProps) {
  useEffect(() => {
    if (!supabase || !currentProfileId) return;

    // Listen for new posts globally
    const postsChannel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const newPost = payload.new;
          // Don't notify the author themselves
          if (newPost.author_id !== currentProfileId) {
            toast.success("Someone just posted a new vibe!", {
              description: "Check it out on the discover feed.",
              action: {
                label: "View Feed",
                onClick: () => window.location.href = "/app",
              },
            });
          }
        }
      )
      .subscribe();

    // Listen for incoming connection requests
    const requestsChannel = supabase
      .channel(`public:connection_requests:receiver_id=eq.${currentProfileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connection_requests",
          filter: `receiver_id=eq.${currentProfileId}`,
        },
        (payload) => {
          const newReq = payload.new;
          if (newReq.status === "pending") {
            toast.info("New connection request!", {
              description: "Someone wants to connect with you.",
              action: {
                label: "View Friends",
                onClick: () => window.location.href = "/app/friends",
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(postsChannel);
      supabase?.removeChannel(requestsChannel);
    };
  }, [currentProfileId]);

  return null;
}
