"use client";

/**
 * Hook: useExperience
 *
 * Provides real-time subscription to a single experience.
 * Uses Firebase Client SDK for live updates.
 */

import { useReducer, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface State {
  experience: Experience | null;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "RESET" }
  | { type: "LOADING" }
  | { type: "SUCCESS"; experience: Experience | null }
  | { type: "ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return { experience: null, loading: false, error: null };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { experience: action.experience, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

/**
 * Subscribe to a single experience with real-time updates.
 * Returns null if experience doesn't exist or is deleted.
 */
export function useExperience(experienceId: string | null): State {
  const [state, dispatch] = useReducer(reducer, {
    experience: null,
    loading: !!experienceId,
    error: null,
  });

  useEffect(() => {
    if (!experienceId) {
      dispatch({ type: "RESET" });
      return;
    }

    dispatch({ type: "LOADING" });
    dispatch({ type: "ERROR", error: new Error("Experience not found") });
  

    return

    const experienceRef = doc(db, "experiences", experienceId);

    const unsubscribe = onSnapshot(
      experienceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          dispatch({ type: "SUCCESS", experience: null });
          return;
        }

        const data = snapshot.data();

        // Return null if experience is deleted
        if (data?.status === "deleted") {
          dispatch({ type: "SUCCESS", experience: null });
          return;
        }

        dispatch({
          type: "SUCCESS",
          experience: { id: snapshot.id, ...data } as Experience,
        });
      },
      (err) => {
        console.error("Error subscribing to experience:", err);
        dispatch({ type: "ERROR", error: err });
      }
    );

    return () => unsubscribe();
  }, [experienceId]);

  return state;
}
