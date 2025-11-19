// Session types
// Extracted from lib/types/firestore.ts

export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

export interface Session {
  id: string;
  eventId: string; // denormalized for convenience

  state: SessionState;

  inputImagePath?: string; // Storage path
  resultImagePath?: string; // Storage path

  error?: string;

  createdAt: number;
  updatedAt: number;
}
