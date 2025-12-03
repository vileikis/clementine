/**
 * Sessions Actions Contract - Post-Cleanup State
 *
 * This contract documents the sessions actions after journeys cleanup.
 * Functions marked as "REMOVED" are deleted in this cleanup.
 * Functions marked as "KEPT" remain for backwards compatibility.
 */

// ============================================================================
// Existing Actions (unchanged)
// ============================================================================

/**
 * Start a basic session for an event
 */
export async function startSessionAction(eventId: string): Promise<{ sessionId: string }>;

/**
 * Save a captured photo to session
 */
export async function saveCaptureAction(formData: FormData): Promise<{ success: boolean; inputImagePath: string }>;

/**
 * Get session by ID
 */
export async function getSessionAction(eventId: string, sessionId: string): Promise<Session | null>;

/**
 * Trigger AI transformation for session
 */
export async function triggerTransformAction(
  eventId: string,
  sessionId: string
): Promise<{ success: boolean; resultImagePath?: string; error?: string }>;

// ============================================================================
// Experience Actions (unchanged)
// ============================================================================

/**
 * Start an experience-based session
 */
export async function startExperienceSessionAction(
  eventId: string,
  experienceId: string
): Promise<{ sessionId: string }>;

/**
 * Load experience and steps for guest
 */
export async function getExperienceForGuestAction(
  experienceId: string
): Promise<
  | { success: true; experience: Experience; steps: Step[] }
  | { success: false; error: string }
>;

// ============================================================================
// Legacy Journey Actions
// ============================================================================

/**
 * @deprecated Use startExperienceSessionAction instead
 * KEPT: Still used by guest module (intentionally broken until Phase 7)
 */
export async function startJourneySessionAction(
  eventId: string,
  journeyId: string
): Promise<{ sessionId: string }>;

/**
 * @deprecated Use getExperienceForGuestAction instead
 * REMOVED: Imports from journeys module - deleted in this cleanup
 */
// export async function getJourneyForGuestAction(...)

// ============================================================================
// Step Navigation Actions (unchanged)
// ============================================================================

/**
 * Advance to next step in session
 */
export async function advanceStepAction(
  eventId: string,
  sessionId: string,
  nextIndex: number
): Promise<{ success: boolean; error?: string }>;

/**
 * Go back to previous step in session
 */
export async function goBackStepAction(
  eventId: string,
  sessionId: string
): Promise<{ success: true; newIndex: number } | { success: false; error: string }>;

/**
 * Save step data to session
 */
export async function saveStepDataAction(
  eventId: string,
  sessionId: string,
  key: string,
  value: unknown
): Promise<{ success: boolean }>;

// ============================================================================
// AI Presets Actions (unchanged)
// ============================================================================

/**
 * Select an experience for the session
 */
export async function selectExperienceAction(
  eventId: string,
  sessionId: string,
  experienceId: string
): Promise<{ success: true } | { success: false; error: string }>;

/**
 * Get AI presets for guest selection
 */
export async function getAiPresetsForGuestAction(
  eventId: string
): Promise<
  | { success: true; aiPresets: AiPreset[] }
  | { success: false; error: string }
>;

/**
 * Retry failed transformation
 */
export async function retryTransformAction(
  eventId: string,
  sessionId: string
): Promise<{ success: true } | { success: false; error: string }>;

// ============================================================================
// Types (for reference)
// ============================================================================

interface Session {
  id: string;
  eventId: string;
  experienceId?: string;
  /** @deprecated Use experienceId instead */
  journeyId?: string;
  currentStepIndex?: number;
  data?: Record<string, unknown>;
  state: "created" | "captured" | "transforming" | "ready" | "error";
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

interface Experience {
  id: string;
  name: string;
  companyId: string;
  // ... other fields
}

interface Step {
  id: string;
  experienceId: string;
  type: string;
  // ... other fields
}

interface AiPreset {
  id: string;
  name: string;
  type: "photo" | "video" | "gif";
  // ... other fields
}
