// Session types - PRESERVED from existing implementation
// Extended with journey support fields

export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

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
