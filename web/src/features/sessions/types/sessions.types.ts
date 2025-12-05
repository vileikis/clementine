// Session types - PRESERVED from existing implementation
// Extended with journey support fields and Experience Engine types

export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

// ============================================================================
// Transformation Status (Experience Engine)
// ============================================================================

/**
 * Status of AI transformation operation.
 * Updated by ai-transform step, monitored by processing step.
 */
export type TransformStatus =
  | "idle" // No transformation triggered
  | "pending" // Job queued, awaiting processing
  | "processing" // AI model actively generating
  | "complete" // Result ready
  | "error"; // Transformation failed

/**
 * Transformation status tracking object.
 */
export interface TransformationStatus {
  /** Current transformation state */
  status: TransformStatus;

  /** URL of transformed result (when complete) */
  resultUrl?: string;

  /** Error message (when failed) */
  errorMessage?: string;

  /** Job ID for tracking (optional) */
  jobId?: string;

  /** Timestamp of last status change */
  updatedAt?: number;
}

/**
 * Discriminated union for type-safe step input storage.
 * Each step type maps to a specific value format.
 */
export type StepInputValue =
  | { type: "text"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "number"; value: number }
  | { type: "selection"; selectedId: string }
  | { type: "selections"; selectedIds: string[] }
  | { type: "photo"; url: string };

// Dynamic data store for step inputs
export interface SessionData {
  selected_experience_id?: string;
  [key: string]: StepInputValue | string | undefined;
}

export interface Session {
  id: string;
  eventId: string;

  state: SessionState;

  // Capture/transform fields (existing)
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;

  // Experience support
  experienceId?: string;
  currentStepIndex?: number;
  data?: SessionData;

  // Legacy field - preserved for backwards compatibility
  /** @deprecated Use experienceId instead */
  journeyId?: string;

  // Timestamps (existing)
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Engine Session (Experience Engine)
// ============================================================================

/**
 * Engine session extends base Session with transformation fields.
 * Used for both ephemeral and persisted modes in Experience Engine.
 */
export interface EngineSession {
  /** Session ID (generated or provided) */
  id: string;

  /** Experience being executed */
  experienceId: string;

  /** Current step index */
  currentStepIndex: number;

  /** Collected step inputs */
  data: SessionData;

  /** Transformation status */
  transformStatus: TransformationStatus;

  /** Timestamps */
  createdAt: number;
  updatedAt: number;

  // === Persisted mode only ===

  /** Event ID (for persisted sessions) */
  eventId?: string;

  /** Project ID (for persisted sessions) */
  projectId?: string;

  /** Company ID (for persisted sessions) */
  companyId?: string;
}
