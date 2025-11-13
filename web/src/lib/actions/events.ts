"use server";

/**
 * Server Actions for event-level mutations.
 * Phase 2 implementation: Stub actions with type signatures only.
 * Full implementation will be added in later phases.
 */

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Updates welcome screen configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial welcome screen fields to update
 * @returns Success/error response
 */
export async function updateEventWelcome(
  eventId: string,
  data: {
    welcomeTitle?: string;
    welcomeDescription?: string;
    welcomeCtaLabel?: string;
    welcomeBackgroundImagePath?: string;
    welcomeBackgroundColorHex?: string;
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 5 (User Story 2)
  throw new Error("Not implemented");
}

/**
 * Updates ending screen and share configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial ending screen and share fields to update
 * @returns Success/error response
 */
export async function updateEventEnding(
  eventId: string,
  data: {
    endHeadline?: string;
    endBody?: string;
    endCtaLabel?: string;
    endCtaUrl?: string;
    shareAllowDownload?: boolean;
    shareAllowSystemShare?: boolean;
    shareAllowEmail?: boolean;
    shareSocials?: Array<
      "instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom"
    >;
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 8 (User Story 5)
  throw new Error("Not implemented");
}

/**
 * Updates survey configuration for an event.
 * @param eventId - Event ID
 * @param data - Partial survey configuration fields to update
 * @returns Success/error response
 */
export async function updateEventSurveyConfig(
  eventId: string,
  data: {
    surveyEnabled?: boolean;
    surveyRequired?: boolean;
    surveyStepsOrder?: string[];
  }
): Promise<ActionResponse<void>> {
  // TODO: Implement in Phase 7 (User Story 4)
  throw new Error("Not implemented");
}
