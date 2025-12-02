"use client";

/**
 * Hook: useSteps
 *
 * Provides real-time subscription to steps for an experience.
 * Uses Firebase Client SDK for live updates.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Step } from "@/features/steps/types";
import type { Experience } from "../types";

interface UseStepsResult {
  steps: Step[];
  loading: boolean;
  error: Error | null;
}

interface SubscriptionState {
  rawSteps: Step[];
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribe to steps for an experience with real-time updates.
 * Steps are ordered according to experience.stepsOrder.
 */
export function useSteps(
  experienceId: string | null,
  experience: Experience | null
): UseStepsResult {
  const [state, setState] = useState<SubscriptionState>({
    rawSteps: [],
    loading: true,
    error: null,
  });

  // Track if we've started a subscription to avoid initial state flicker
  const hasSubscribed = useRef(false);

  // Memoize stepsOrder array to prevent unnecessary re-renders
  const stepsOrderKey = experience?.stepsOrder?.join(",") ?? "";

  useEffect(() => {
    // Early return for missing params
    if (!experienceId) {
      return;
    }

    // Only update loading state once per subscription lifecycle
    if (!hasSubscribed.current) {
      hasSubscribed.current = true;
    }

    // Subscribe to steps subcollection
    const stepsRef = collection(db, "experiences", experienceId, "steps");

    const unsubscribe = onSnapshot(
      stepsRef,
      (snapshot) => {
        const stepsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Step[];

        setState({
          rawSteps: stepsData,
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.error("Error subscribing to steps:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
      }
    );

    return () => {
      hasSubscribed.current = false;
      unsubscribe();
    };
  }, [experienceId]);

  // Order steps by experience.stepsOrder (memoized)
  const steps = useMemo(() => {
    if (!experienceId) {
      return [];
    }

    const stepsOrder = stepsOrderKey ? stepsOrderKey.split(",") : null;

    if (stepsOrder && stepsOrder.length > 0 && stepsOrder[0] !== "") {
      return stepsOrder
        .map((id) => state.rawSteps.find((s) => s.id === id))
        .filter((s): s is Step => s !== undefined);
    }

    // Fallback: order by createdAt
    return [...state.rawSteps].sort((a, b) => a.createdAt - b.createdAt);
  }, [state.rawSteps, stepsOrderKey, experienceId]);

  // Handle early return case for missing params
  if (!experienceId) {
    return { steps: [], loading: false, error: null };
  }

  return { steps, loading: state.loading, error: state.error };
}
