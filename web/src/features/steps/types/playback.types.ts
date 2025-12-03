/**
 * Playback types for Journey Playback Mode (009-journey-playback)
 *
 * These types define the ephemeral client-side state for journey playback.
 * No Firestore documents are created - all state exists in memory only.
 */

import type { Step } from "./step.types";
import type { ProjectTheme as EventTheme } from "@/features/projects/types";
import type { AiPreset } from "@/features/ai-presets/types";
import type { MockSessionData } from "./preview.types";

// ============================================================================
// Playback State Types
// ============================================================================

/**
 * Playback status enum
 */
export type PlaybackStatus = "idle" | "playing" | "completed";

/**
 * Main playback state object
 */
export interface PlaybackState {
  /** Current status of playback */
  status: PlaybackStatus;

  /** Index of currently displayed step (0-based) */
  currentIndex: number;

  /** Ordered array of steps in the journey */
  steps: Step[];

  /** Whether back navigation is available */
  canGoBack: boolean;

  /** Whether forward navigation is available */
  canGoNext: boolean;

  /** Whether currently auto-advancing (disables manual nav briefly) */
  isAutoAdvancing: boolean;
}

/**
 * Initial/default playback state
 */
export const INITIAL_PLAYBACK_STATE: PlaybackState = {
  status: "idle",
  currentIndex: 0,
  steps: [],
  canGoBack: false,
  canGoNext: false,
  isAutoAdvancing: false,
};

// ============================================================================
// Mock Session Types
// ============================================================================

/**
 * Discriminated union for step input values
 */
export type StepInputValue =
  | { type: "text"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "number"; value: number }
  | { type: "selection"; selectedId: string }
  | { type: "photo"; url: string };

/**
 * Extended mock session for playback mode
 * Includes all inputs collected during playback
 */
export interface PlaybackMockSession extends MockSessionData {
  /**
   * Collected inputs keyed by step ID
   * Persists across navigation for the duration of playback
   */
  inputs: Record<string, StepInputValue>;

  /**
   * Selected experience ID (from ExperiencePicker step)
   */
  selectedExperienceId: string | null;
}

/**
 * Default playback session with mock data
 */
export const DEFAULT_PLAYBACK_SESSION: PlaybackMockSession = {
  // Inherited from MockSessionData
  guestId: "preview-guest-001",
  capturedPhoto: "/placeholders/selfie-placeholder.svg",
  transformedPhoto: "/placeholders/transformed-placeholder.svg",
  variables: {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Acme Corp",
  },
  currentStepIndex: 0,

  // Playback-specific
  inputs: {},
  selectedExperienceId: null,
};

// ============================================================================
// Action Types
// ============================================================================

/**
 * Actions available for playback control
 */
export interface PlaybackActions {
  /** Initialize playback with journey steps */
  start: (steps: Step[]) => void;

  /** Navigate to next step (or complete if at end) */
  next: () => void;

  /** Navigate to previous step */
  previous: () => void;

  /** Reset to first step and clear session */
  restart: () => void;

  /** Exit playback mode entirely */
  exit: () => void;

  /** Handle step completion (for auto-advance) */
  handleStepComplete: (stepId: string) => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for PreviewNavigationBar component
 */
export interface PreviewNavigationBarProps {
  /** Current step index (0-based) */
  currentIndex: number;

  /** Total number of steps */
  totalSteps: number;

  /** Whether back button is enabled */
  canGoBack: boolean;

  /** Whether next button is enabled */
  canGoNext: boolean;

  /** Whether playback has completed */
  isCompleted: boolean;

  /** Callback for back button */
  onBack: () => void;

  /** Callback for next button */
  onNext: () => void;

  /** Callback for restart button */
  onRestart: () => void;

  /** Callback for exit button */
  onExit: () => void;
}

/**
 * Props for PlaybackMode component
 */
export interface PlaybackModeProps {
  /** Ordered array of steps to play */
  steps: Step[];

  /** Event theme for styling */
  theme: EventTheme;

  /** Available experiences (for ExperiencePicker and Capture steps) */
  aiPresets: AiPreset[];

  /** Initial viewport mode */
  initialViewport?: "mobile" | "desktop";

  /** Callback when playback is exited */
  onExit: () => void;
}
