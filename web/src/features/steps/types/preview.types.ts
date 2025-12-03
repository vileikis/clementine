/**
 * Preview viewport modes
 */
export type ViewportMode = "mobile" | "desktop";

/**
 * Viewport dimensions configuration
 */
export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Dimension lookup by mode
 */
export const VIEWPORT_DIMENSIONS: Record<ViewportMode, ViewportDimensions> = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 900, height: 600 },
};

/**
 * Mock session data for preview mode
 * Matches structure of future guest runtime session
 */
export interface MockSessionData {
  /** Unique identifier for the preview session */
  guestId: string;

  /** Placeholder captured photo URL */
  capturedPhoto: string | null;

  /** Placeholder transformed result URL */
  transformedPhoto: string | null;

  /** Simulated form input values keyed by variable name */
  variables: Record<string, string>;

  /** Current step index in experience (for multi-step preview) */
  currentStepIndex: number;
}

/**
 * Default mock session
 */
export const DEFAULT_MOCK_SESSION: MockSessionData = {
  guestId: "preview-guest-001",
  capturedPhoto: "/placeholders/selfie-placeholder.svg",
  transformedPhoto: "/placeholders/transformed-placeholder.svg",
  variables: {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Acme Corp",
    selectedExperience: "exp-001",
  },
  currentStepIndex: 0,
};
