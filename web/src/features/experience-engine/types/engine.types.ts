// ============================================================================
// Engine Types
// ============================================================================
// Core types for Experience Engine configuration and state management.

import type { Step } from "@/features/steps/types";
import type { Theme } from "@/features/theming";
import type { SessionData } from "@/features/sessions";
import type { EngineSession, TransformationStatus } from "@/features/sessions/types";

// ============================================================================
// Engine Configuration
// ============================================================================

/**
 * Configuration for initializing the Experience Engine.
 * Passed as props to ExperienceEngine component.
 */
export interface EngineConfig {
  // === Required ===

  /** Experience ID being executed */
  experienceId: string;

  /** Array of step configurations */
  steps: Step[];

  /** Ordered array of step IDs defining execution sequence */
  stepsOrder: string[];

  /** Human-readable flow name (for logging/analytics) */
  flowName: string;

  // === Session Mode ===

  /**
   * Session persistence mode:
   * - true: Syncs to Firestore (Guest Flow)
   * - false: In-memory only (Admin Preview)
   */
  persistSession: boolean;

  /** Existing session ID to resume (persisted mode only) */
  existingSessionId?: string;

  // === Navigation Flags ===

  /** Allow backward navigation */
  allowBack: boolean;

  /** Allow skipping steps */
  allowSkip: boolean;

  // === Integration ===

  /** Enable debug logging and dev tools */
  debugMode: boolean;

  /** Theme for step rendering */
  theme?: Theme;

  // === Context (persisted mode) ===

  /** Project ID for session creation */
  projectId?: string;

  /** Event ID for session creation */
  eventId?: string;

  /** Company ID for session creation */
  companyId?: string;

  // === Lifecycle Callbacks ===

  /** Fired when engine starts execution */
  onStart?: (session: EngineSession) => void;

  /** Fired on step navigation */
  onStepChange?: (info: StepChangeInfo) => void;

  /** Fired when session data changes */
  onDataUpdate?: (data: SessionData) => void;

  /** Fired when experience completes */
  onComplete?: (session: EngineSession) => void;

  /** Fired on unrecoverable error */
  onError?: (error: EngineError) => void;
}

/**
 * Lifecycle callbacks interface
 */
export interface EngineCallbacks {
  onStart?: (session: EngineSession) => void;
  onStepChange?: (info: StepChangeInfo) => void;
  onDataUpdate?: (data: SessionData) => void;
  onComplete?: (session: EngineSession) => void;
  onError?: (error: EngineError) => void;
}

// ============================================================================
// Engine State
// ============================================================================

/**
 * Engine execution status
 */
export type EngineStatus =
  | "idle" // Not started
  | "loading" // Initializing/resuming session
  | "running" // Actively executing steps
  | "completed" // Reached end of experience
  | "error"; // Unrecoverable error occurred

/**
 * Runtime state of the Experience Engine.
 * Managed by useEngine hook.
 */
export interface EngineState {
  /** Current execution status */
  status: EngineStatus;

  /** Index of currently displayed step (0-based) */
  currentStepIndex: number;

  /** Current step configuration (derived from index) */
  currentStep: Step | null;

  /** Session data containing collected inputs */
  sessionData: SessionData;

  /** Transformation status for AI operations */
  transformStatus: TransformationStatus;

  // === Navigation Availability ===

  /** Can navigate backward */
  canGoBack: boolean;

  /** Can navigate forward */
  canGoNext: boolean;

  /** Can skip current step */
  canSkip: boolean;

  /** Auto-advance in progress (blocks manual nav) */
  isAutoAdvancing: boolean;

  /** Error if status is "error" */
  error?: EngineError;
}

// ============================================================================
// Engine Actions
// ============================================================================

/**
 * Navigation and state actions exposed by useEngine hook.
 */
export interface EngineActions {
  /** Navigate to next step */
  next: () => void;

  /** Navigate to previous step (if allowed) */
  previous: () => void;

  /** Skip current step (if allowed) */
  skip: () => void;

  /** Restart from first step */
  restart: () => void;

  /** Update input value for current step */
  updateInput: (stepId: string, value: import("@/features/sessions").StepInputValue) => void;

  /** Jump to specific step (admin/debug only) */
  goToStep: (index: number) => void;
}

// ============================================================================
// Callback Payloads
// ============================================================================

/**
 * Information passed to onStepChange callback.
 */
export interface StepChangeInfo {
  /** New step index (0-based) */
  index: number;

  /** Step configuration */
  step: Step;

  /** Navigation direction */
  direction: "forward" | "backward" | "skip" | "restart";

  /** Previous step index */
  previousIndex: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for engine operations.
 */
export type EngineErrorCode =
  | "INIT_FAILED" // Engine initialization failed
  | "SESSION_LOAD_FAILED" // Could not load/resume session
  | "SESSION_SYNC_FAILED" // Real-time sync failed
  | "TRANSFORM_FAILED" // AI transformation failed
  | "RENDERER_ERROR" // Step renderer crashed
  | "NAV_BLOCKED" // Navigation not allowed
  | "UNKNOWN"; // Unexpected error

/**
 * Structured error for engine operations.
 */
export interface EngineError {
  /** Error code for programmatic handling */
  code: EngineErrorCode;

  /** Human-readable message */
  message: string;

  /** Step ID where error occurred (if applicable) */
  stepId?: string;

  /** Original error (for debugging) */
  cause?: Error;
}
