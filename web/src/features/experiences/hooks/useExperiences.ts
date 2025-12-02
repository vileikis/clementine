"use client";

/**
 * Hook: useExperiences
 *
 * Provides real-time subscription to experiences for a company.
 * Uses Firebase Client SDK for live updates.
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Experience } from "../types";

interface UseExperiencesResult {
  experiences: Experience[];
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribe to experiences for a company with real-time updates.
 * Only returns active (non-deleted) experiences.
 * Sorted by createdAt descending (newest first).
 */
export function useExperiences(companyId: string | null): UseExperiencesResult {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(!!companyId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Early return for missing params
    if (!companyId) {
      return;
    }

    // Subscribe to experiences collection filtered by companyId
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

        setExperiences(experiencesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error subscribing to experiences:", err);
        setLoading(false);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  return { experiences, loading, error };
}
