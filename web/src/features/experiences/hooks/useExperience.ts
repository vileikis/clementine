"use client";

/**
 * Hook: useExperience
 *
 * Provides real-time subscription to a single experience.
 * Uses Firebase Client SDK for live updates.
 */

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface UseExperienceResult {
  experience: Experience | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribe to a single experience with real-time updates.
 * Returns null if experience doesn't exist or is deleted.
 */
export function useExperience(experienceId: string | null): UseExperienceResult {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(!!experienceId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Early return for missing params
    if (!experienceId) {
      return;
    }

    // Subscribe to single experience document
    const experienceRef = doc(db, "experiences", experienceId);

    const unsubscribe = onSnapshot(
      experienceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setExperience(null);
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        // Return null if experience is deleted
        if (data?.status === "deleted") {
          setExperience(null);
          setLoading(false);
          return;
        }

        setExperience({
          id: snapshot.id,
          ...data,
        } as Experience);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error subscribing to experience:", err);
        setLoading(false);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [experienceId]);

  return { experience, loading, error };
}
