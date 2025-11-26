"use client";

/**
 * Hook: useSteps
 *
 * Provides real-time subscription to steps for a journey.
 * Uses Firebase Client SDK for live updates.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Step } from "@/features/steps/types";
import type { Journey } from "../types";

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
 * Subscribe to steps for a journey with real-time updates.
 * Steps are ordered according to journey.stepOrder.
 */
export function useSteps(
  eventId: string,
  journeyId: string,
  journey: Journey | null
): UseStepsResult {
  const [state, setState] = useState<SubscriptionState>({
    rawSteps: [],
    loading: true,
    error: null,
  });

  // Track if we've started a subscription to avoid initial state flicker
  const hasSubscribed = useRef(false);

  // Memoize stepOrder array to prevent unnecessary re-renders
  const stepOrderKey = journey?.stepOrder?.join(",") ?? "";

  useEffect(() => {
    // Early return for missing params
    if (!eventId || !journeyId) {
      return;
    }

    // Only update loading state once per subscription lifecycle
    if (!hasSubscribed.current) {
      hasSubscribed.current = true;
    }

    // Subscribe to steps collection filtered by journeyId
    const stepsRef = collection(db, "events", eventId, "steps");
    const stepsQuery = query(stepsRef, where("journeyId", "==", journeyId));

    const unsubscribe = onSnapshot(
      stepsQuery,
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
  }, [eventId, journeyId]);

  // Order steps by journey.stepOrder (memoized)
  const steps = useMemo(() => {
    if (!eventId || !journeyId) {
      return [];
    }

    const stepOrder = stepOrderKey ? stepOrderKey.split(",") : null;

    if (stepOrder && stepOrder.length > 0 && stepOrder[0] !== "") {
      return stepOrder
        .map((id) => state.rawSteps.find((s) => s.id === id))
        .filter((s): s is Step => s !== undefined);
    }

    // Fallback: order by createdAt
    return [...state.rawSteps].sort((a, b) => a.createdAt - b.createdAt);
  }, [state.rawSteps, stepOrderKey, eventId, journeyId]);

  // Handle early return case for missing params
  if (!eventId || !journeyId) {
    return { steps: [], loading: false, error: null };
  }

  return { steps, loading: state.loading, error: state.error };
}
