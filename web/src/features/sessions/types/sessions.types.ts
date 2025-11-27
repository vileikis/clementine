// Session types - PRESERVED from existing implementation
// Extended with journey support fields

export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

// Dynamic data store for step inputs
export interface SessionData {
  selected_experience_id?: string;
  [key: string]: unknown;
}

export interface Session {
  id: string;
  eventId: string;

  state: SessionState;

  // Capture/transform fields (existing)
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;

  // Journey support
  journeyId?: string;
  currentStepIndex?: number;
  data?: SessionData;

  // Timestamps (existing)
  createdAt: number;
  updatedAt: number;
}
