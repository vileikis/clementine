"use client";

/**
 * Hook: useEventExperiences
 *
 * Fetches experiences for an event using a server action.
 * Returns experiences that have this eventId in their eventIds array.
 */

import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { listExperiencesByEventAction } from "@/features/experiences/actions/list";
import type { Experience } from "@/features/experiences/types";

interface UseEventExperiencesResult {
  experiences: Experience[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type State = {
  experiences: Experience[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: Experience[] }
  | { type: "FETCH_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { experiences: action.data, loading: false, error: null };
    case "FETCH_ERROR":
      return { experiences: [], loading: false, error: action.error };
    default:
      return state;
  }
}

/**
 * Fetches experiences for an event.
 * Caches result until eventId changes or refresh is called.
 */
export function useEventExperiences(eventId: string): UseEventExperiencesResult {
  const [state, dispatch] = useReducer(reducer, {
    experiences: [],
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
          error: result.error?.message ?? "Failed to load experiences",
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
    return { experiences: [], loading: false, error: null, refresh };
  }

  return { ...state, refresh };
}
