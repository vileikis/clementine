"use client";

/**
 * Hook: useJourneyPlayback
 *
 * Main playback controller for journey step-by-step navigation.
 * Manages playback state, navigation, and coordinates with useMockSession.
 *
 * Features:
 * - Linear step navigation (next/previous)
 * - Auto-advance support for Capture and Processing steps
 * - State reset on restart
 * - Exit callback for closing playback
 */

import { useState, useCallback, useRef } from "react";
import type { Step } from "../types/step.types";
import {
  PlaybackState,
  PlaybackStatus,
  INITIAL_PLAYBACK_STATE,
  PlaybackActions,
} from "../types/playback.types";
import { useMockSession } from "./useMockSession";

interface UseJourneyPlaybackReturn {
  /** Current playback state */
  state: PlaybackState;

  /** Playback control actions */
  actions: PlaybackActions;

  /** Mock session state and helpers */
  mockSession: ReturnType<typeof useMockSession>;
}

/** Step types that support auto-advance */
const AUTO_ADVANCE_STEP_TYPES = ["capture", "processing"] as const;

/** Debounce delay for navigation actions (ms) */
const NAV_DEBOUNCE_DELAY = 150;

export function useJourneyPlayback(
  onExit: () => void
): UseJourneyPlaybackReturn {
  const [state, setState] = useState<PlaybackState>(INITIAL_PLAYBACK_STATE);
  const mockSession = useMockSession();

  // Ref to prevent double auto-advance
  const isAutoAdvancingRef = useRef(false);

  // Ref for navigation debouncing
  const lastNavTimeRef = useRef(0);

  /**
   * Check if navigation should be allowed (debounce check)
   */
  const canNavigate = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_DEBOUNCE_DELAY) {
      return false;
    }
    lastNavTimeRef.current = now;
    return true;
  }, []);

  /**
   * Compute navigation availability based on current index and steps
   */
  const computeNavState = useCallback(
    (index: number, steps: Step[], status: PlaybackStatus) => ({
      canGoBack: index > 0 && status === "playing",
      canGoNext: status === "playing" && index < steps.length - 1,
    }),
    []
  );

  /**
   * Start playback with given steps
   */
  const start = useCallback(
    (steps: Step[]) => {
      if (steps.length === 0) {
        setState({
          ...INITIAL_PLAYBACK_STATE,
          status: "playing",
          steps,
          canGoBack: false,
          canGoNext: false,
        });
        return;
      }

      const navState = computeNavState(0, steps, "playing");
      setState({
        status: "playing",
        currentIndex: 0,
        steps,
        isAutoAdvancing: false,
        ...navState,
      });
    },
    [computeNavState]
  );

  /**
   * Navigate to next step or complete if at end
   */
  const next = useCallback(() => {
    if (!canNavigate()) return;

    setState((prev) => {
      if (prev.status !== "playing" || prev.isAutoAdvancing) return prev;

      const nextIndex = prev.currentIndex + 1;

      // Check if we've completed the journey
      if (nextIndex >= prev.steps.length) {
        return {
          ...prev,
          status: "completed",
          canGoBack: true,
          canGoNext: false,
        };
      }

      const navState = computeNavState(nextIndex, prev.steps, "playing");
      return {
        ...prev,
        currentIndex: nextIndex,
        ...navState,
      };
    });
  }, [canNavigate, computeNavState]);

  /**
   * Navigate to previous step
   */
  const previous = useCallback(() => {
    if (!canNavigate()) return;

    setState((prev) => {
      if (prev.currentIndex <= 0 || prev.isAutoAdvancing) return prev;

      const prevIndex = prev.currentIndex - 1;
      const status = prev.status === "completed" ? "playing" : prev.status;
      const navState = computeNavState(prevIndex, prev.steps, status);

      return {
        ...prev,
        status,
        currentIndex: prevIndex,
        ...navState,
      };
    });
  }, [canNavigate, computeNavState]);

  /**
   * Restart playback from the beginning and clear session
   */
  const restart = useCallback(() => {
    mockSession.reset();
    isAutoAdvancingRef.current = false;

    setState((prev) => {
      if (prev.steps.length === 0) {
        return {
          ...INITIAL_PLAYBACK_STATE,
          status: "playing",
          steps: prev.steps,
        };
      }

      const navState = computeNavState(0, prev.steps, "playing");
      return {
        ...prev,
        status: "playing",
        currentIndex: 0,
        isAutoAdvancing: false,
        ...navState,
      };
    });
  }, [computeNavState, mockSession]);

  /**
   * Exit playback mode
   */
  const exit = useCallback(() => {
    setState(INITIAL_PLAYBACK_STATE);
    mockSession.reset();
    isAutoAdvancingRef.current = false;
    onExit();
  }, [mockSession, onExit]);

  /**
   * Handle step completion for auto-advance support
   * Only advances for Capture and Processing step types
   */
  const handleStepComplete = useCallback(
    (stepId: string) => {
      // Prevent double auto-advance
      if (isAutoAdvancingRef.current) return;

      setState((prev) => {
        const currentStep = prev.steps[prev.currentIndex];

        // Verify this is the current step and it supports auto-advance
        if (
          !currentStep ||
          currentStep.id !== stepId ||
          !AUTO_ADVANCE_STEP_TYPES.includes(
            currentStep.type as (typeof AUTO_ADVANCE_STEP_TYPES)[number]
          )
        ) {
          return prev;
        }

        isAutoAdvancingRef.current = true;

        // Mark as auto-advancing briefly to prevent manual nav interference
        return {
          ...prev,
          isAutoAdvancing: true,
        };
      });

      // Small delay before advancing to show completion state
      setTimeout(() => {
        isAutoAdvancingRef.current = false;
        setState((prev) => ({
          ...prev,
          isAutoAdvancing: false,
        }));
        next();
      }, 100);
    },
    [next]
  );

  const actions: PlaybackActions = {
    start,
    next,
    previous,
    restart,
    exit,
    handleStepComplete,
  };

  return {
    state,
    actions,
    mockSession,
  };
}
