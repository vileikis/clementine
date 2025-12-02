"use client";

/**
 * Hook: useEventAiPresets
 *
 * Fetches AI presets for an event using a server action.
 * Returns AI presets that have this eventId in their eventIds array.
 */

import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { listExperiencesByEventAction } from "@/features/ai-presets/actions/list";
import type { AiPreset } from "@/features/ai-presets/types";

interface UseEventAiPresetsResult {
  aiPresets: AiPreset[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type State = {
  aiPresets: AiPreset[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: AiPreset[] }
  | { type: "FETCH_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { aiPresets: action.data, loading: false, error: null };
    case "FETCH_ERROR":
      return { aiPresets: [], loading: false, error: action.error };
    default:
      return state;
  }
}

/**
 * Fetches AI presets for an event.
 * Caches result until eventId changes or refresh is called.
 */
export function useEventAiPresets(eventId: string): UseEventAiPresetsResult {
  const [state, dispatch] = useReducer(reducer, {
    aiPresets: [],
    loading: !!eventId,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    isMounted.current = true;
    let cancelled = false;

    // Use IIFE to handle async
    (async () => {
      dispatch({ type: "FETCH_START" });

      const result = await listExperiencesByEventAction(eventId);

      if (cancelled || !isMounted.current) return;

      if (result.success) {
        dispatch({ type: "FETCH_SUCCESS", data: result.data ?? [] });
      } else {
        dispatch({
          type: "FETCH_ERROR",
          error: result.error?.message ?? "Failed to load AI presets",
        });
      }
    })();

    return () => {
      cancelled = true;
      isMounted.current = false;
    };
  }, [eventId, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!eventId) {
    return { aiPresets: [], loading: false, error: null, refresh };
  }

  return { ...state, refresh };
}

// Legacy alias for backward compatibility
/** @deprecated Use useEventAiPresets instead */
export function useEventExperiences(eventId: string): {
  experiences: AiPreset[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const result = useEventAiPresets(eventId);
  return {
    experiences: result.aiPresets,
    loading: result.loading,
    error: result.error,
    refresh: result.refresh,
  };
}
