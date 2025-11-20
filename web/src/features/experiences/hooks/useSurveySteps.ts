"use client";

/**
 * Hook: useSurveySteps
 *
 * Real-time subscription to survey steps for an event.
 * Uses Firebase Client SDK's onSnapshot for live updates.
 * Part of 001-survey-experience implementation (Phase 2 - Foundational Layer).
 */

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { surveyStepSchema, type SurveyStep } from "../lib/schemas";

interface UseSurveyStepsReturn {
  steps: SurveyStep[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to real-time updates for all survey steps in an event.
 *
 * @param eventId - Event ID to subscribe to
 * @returns Object containing steps array, loading state, and error message
 *
 * @example
 * ```tsx
 * const { steps, loading, error } = useSurveySteps(eventId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <StepList steps={steps} />;
 * ```
 */
export function useSurveySteps(eventId: string): UseSurveyStepsReturn {
  const [steps, setSteps] = useState<SurveyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate eventId
    if (!eventId) {
      // Use Promise.resolve to avoid synchronous setState
      Promise.resolve().then(() => {
        setError("Event ID is required");
        setLoading(false);
      });
      return;
    }

    // Reference to the steps subcollection
    const stepsRef = collection(db, "events", eventId, "steps");
    const stepsQuery = query(stepsRef, orderBy("createdAt", "asc"));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      stepsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const parsedSteps = snapshot.docs.map((doc) => {
            const data = doc.data();
            return surveyStepSchema.parse({
              id: doc.id,
              ...data,
            });
          });

          setSteps(parsedSteps);
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error("Error parsing survey steps:", err);
          setError(
            err instanceof Error ? err.message : "Failed to parse survey steps"
          );
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error subscribing to survey steps:", err);
        setError(err.message || "Failed to subscribe to survey steps");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return { steps, loading, error };
}
