"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

// Filtered Realtime subscription for a single meeting review row.
// The brief locks: never broad-subscribe to meeting_reviews — Phase 3
// may have multiple meetings analyzing simultaneously, so the filter
// keeps payloads tight and avoids cross-meeting noise.
export function useMeetingReviewRealtime(
  granolaMeetingId: string,
  onChange: () => void
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`meeting-review:${granolaMeetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_reviews",
          filter: `granola_meeting_id=eq.${granolaMeetingId}`,
        },
        () => {
          onChangeRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [granolaMeetingId]);
}
