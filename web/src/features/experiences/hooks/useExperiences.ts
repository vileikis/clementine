"use client";

/**
 * Hook: useExperiences
 *
 * Provides real-time subscription to experiences for a company.
 * Uses Firebase Client SDK for live updates.
 */

import { useReducer, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface State {
  experiences: Experience[];
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "RESET" }
  | { type: "LOADING" }
  | { type: "SUCCESS"; experiences: Experience[] }
  | { type: "ERROR"; error: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return { experiences: [], loading: false, error: null };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { experiences: action.experiences, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.error };
  }
}

/**
 * Subscribe to experiences for a company with real-time updates.
 * Only returns active (non-deleted) experiences.
 * Sorted by createdAt descending (newest first).
 */
export function useExperiences(companyId: string | null): State {
  const [state, dispatch] = useReducer(reducer, {
    experiences: [],
    loading: !!companyId,
    error: null,
  });

  useEffect(() => {
    if (!companyId) {
      dispatch({ type: "RESET" });
      return;
    }

    dispatch({ type: "LOADING" });

    const experiencesRef = collection(db, "experiences");
    const experiencesQuery = query(
      experiencesRef,
      where("companyId", "==", companyId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      experiencesQuery,
      (snapshot) => {
        const experiencesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Experience[];

        dispatch({ type: "SUCCESS", experiences: experiencesData });
      },
      (err) => {
        console.error("Error subscribing to experiences:", err);
        dispatch({ type: "ERROR", error: err });
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  return state;
}
