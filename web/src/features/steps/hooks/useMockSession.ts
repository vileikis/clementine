"use client";

/**
 * Hook: useMockSession
 *
 * Manages the ephemeral mock session state during experience playback.
 * Provides state management for user inputs across steps and reset functionality.
 *
 * All state is in-memory only - no Firestore writes.
 */

import { useState, useCallback } from "react";
import {
  PlaybackMockSession,
  DEFAULT_PLAYBACK_SESSION,
  StepInputValue,
} from "../types/playback.types";

interface UseMockSessionReturn {
  /** Current mock session state */
  session: PlaybackMockSession;

  /** Update input value for a specific step */
  updateInput: (stepId: string, value: StepInputValue) => void;

  /** Set the selected experience ID */
  setSelectedExperience: (experienceId: string | null) => void;

  /** Reset session to defaults */
  reset: () => void;
}

export function useMockSession(): UseMockSessionReturn {
  const [session, setSession] = useState<PlaybackMockSession>(
    DEFAULT_PLAYBACK_SESSION
  );

  const updateInput = useCallback((stepId: string, value: StepInputValue) => {
    setSession((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [stepId]: value,
      },
    }));
  }, []);

  const setSelectedExperience = useCallback(
    (experienceId: string | null) => {
      setSession((prev) => ({
        ...prev,
        selectedExperienceId: experienceId,
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setSession({
      ...DEFAULT_PLAYBACK_SESSION,
      inputs: {},
      selectedExperienceId: null,
    });
  }, []);

  return {
    session,
    updateInput,
    setSelectedExperience,
    reset,
  };
}
