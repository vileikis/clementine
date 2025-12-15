"use client";

/**
 * Hook: useExperienceDetails
 *
 * Batch fetches experience details by array of IDs.
 * Returns a Record for O(1) lookups by experience ID.
 */

import { useReducer, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface State {
  experiencesMap: Record<string, Experience>;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "RESET" }
  | { type: "LOADING" }
  | { type: "SUCCESS"; experiencesMap: Record<string, Experience> }
  | { type: "ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return { experiencesMap: {}, loading: false, error: null };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { experiencesMap: action.experiencesMap, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

/**
 * Fetch experience details for a list of experience IDs.
 * Returns a Record for efficient lookups.
 *
 * @param experienceIds - Array of experience IDs to fetch
 * @returns State object with experiencesMap, loading, and error
 */
export function useExperienceDetails(experienceIds: string[]): State {
  // Memoize the stringified IDs to avoid unnecessary re-renders
  // Use slice() to create a shallow copy before sorting to avoid mutating the input array
  const idsKey = useMemo(() => [...experienceIds].sort().join(","), [experienceIds]);

  const [state, dispatch] = useReducer(reducer, {
    experiencesMap: {},
    loading: experienceIds.length > 0,
    error: null,
  });

  useEffect(() => {
    if (experienceIds.length === 0) {
      dispatch({ type: "RESET" });
      return;
    }

    dispatch({ type: "LOADING" });

    const fetchExperiences = async () => {
      try {
        const results = await Promise.all(
          experienceIds.map(async (id) => {
            try {
              const docRef = doc(db, "experiences", id);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                return { id, ...docSnap.data() } as Experience;
              }
              return null;
            } catch {
              // Individual fetch failures don't fail the whole batch
              console.warn(`Failed to fetch experience: ${id}`);
              return null;
            }
          })
        );

        const record: Record<string, Experience> = {};
        results.forEach((exp) => {
          if (exp) record[exp.id] = exp;
        });

        dispatch({ type: "SUCCESS", experiencesMap: record });
      } catch (err) {
        console.error("Error fetching experience details:", err);
        dispatch({ type: "ERROR", error: err as Error });
      }
    };

    fetchExperiences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return state;
}
