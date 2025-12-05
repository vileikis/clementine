// ============================================================================
// Variable Interpolation
// ============================================================================
// Utility for replacing {{variable}} placeholders in AI prompts
// with actual values from session data.

import type { AiTransformVariable } from "@/features/steps/types";
import type { SessionData, StepInputValue } from "@/features/sessions";

/**
 * Extract a string value from a StepInputValue.
 * Handles all input types gracefully.
 */
function extractValueAsString(input: StepInputValue | string | undefined): string {
  if (input === undefined || input === null) {
    return "";
  }

  // Handle raw string (e.g., selected_experience_id)
  if (typeof input === "string") {
    return input;
  }

  // Handle discriminated union types
  switch (input.type) {
    case "text":
      return input.value;
    case "boolean":
      return input.value ? "yes" : "no";
    case "number":
      return String(input.value);
    case "selection":
      return input.selectedId;
    case "selections":
      return input.selectedIds.join(", ");
    case "photo":
      return input.url;
    default:
      return "";
  }
}

/**
 * Interpolate variables in a prompt template.
 * Replaces {{variable}} placeholders with actual values from session data.
 *
 * @param prompt - The prompt template with {{variable}} placeholders
 * @param sessionData - Current session data containing step inputs
 * @param variables - Variable configuration array from AI transform step
 * @returns The interpolated prompt with all variables replaced
 *
 * @example
 * ```ts
 * const prompt = "Transform {{photo}} into a {{style}} portrait";
 * const result = interpolateVariables(prompt, sessionData, [
 *   { key: "photo", sourceType: "capture", sourceStepId: "capture-1" },
 *   { key: "style", sourceType: "input", sourceStepId: "style-step" },
 * ]);
 * // Result: "Transform https://example.com/photo.jpg into a watercolor portrait"
 * ```
 */
export function interpolateVariables(
  prompt: string,
  sessionData: SessionData,
  variables: AiTransformVariable[]
): string {
  let result = prompt;

  for (const variable of variables) {
    const placeholder = `{{${variable.key}}}`;
    let value = "";

    if (variable.sourceType === "static") {
      // Static value is provided directly in the variable config
      value = variable.staticValue ?? "";
    } else {
      // Dynamic value comes from session data
      // sourceType is "capture" or "input" - both use sourceStepId
      const stepId = variable.sourceStepId ?? "";
      const input = sessionData[stepId];
      value = extractValueAsString(input);
    }

    // Replace all occurrences of the placeholder
    result = result.replaceAll(placeholder, value);
  }

  return result;
}

/**
 * Get the captured photo URL from session data.
 * Looks for any photo-type input value.
 *
 * @param sessionData - Current session data
 * @param captureStepId - Optional specific step ID to look for
 * @returns The photo URL or undefined if not found
 */
export function getCapturedPhotoUrl(
  sessionData: SessionData,
  captureStepId?: string
): string | undefined {
  // If a specific step ID is provided, look there first
  if (captureStepId) {
    const input = sessionData[captureStepId];
    if (input && typeof input === "object" && input.type === "photo") {
      return input.url;
    }
  }

  // Otherwise, search all entries for a photo type
  for (const [, value] of Object.entries(sessionData)) {
    if (value && typeof value === "object" && "type" in value && value.type === "photo") {
      return value.url;
    }
  }

  return undefined;
}
