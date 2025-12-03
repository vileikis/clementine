/**
 * Steps Server Actions API Contract
 *
 * Feature: 017-steps-consolidate
 * Date: 2025-12-03
 *
 * These Server Actions are the consolidated interface for all step CRUD operations.
 * Location: web/src/features/steps/actions/steps.ts
 */

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Input for creating a new step
 */
interface CreateStepInput {
  experienceId: string; // Parent experience ID (required)
  type: StepType; // Step type
  title?: string | null; // Optional title
  description?: string | null; // Optional description
  mediaUrl?: string | null; // Optional media URL
  mediaType?: MediaType | null; // Optional media type
  ctaLabel?: string | null; // Optional CTA label
  config?: StepConfig; // Type-specific config (uses defaults if omitted)
}

/**
 * Input for updating an existing step
 */
interface UpdateStepInput {
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  ctaLabel?: string | null;
  config?: StepConfig;
}

// ============================================================================
// OUTPUT SCHEMAS
// ============================================================================

/**
 * Standard action response wrapper
 */
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
  };
}

type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "MAX_STEPS_REACHED"
  | "INTERNAL_ERROR";

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * List all steps for an experience
 *
 * @param experienceId - The parent experience ID
 * @returns Steps array ordered by experience.stepsOrder
 */
declare function listStepsAction(
  experienceId: string
): Promise<ActionResponse<Step[]>>;

/**
 * Get a single step by ID
 *
 * @param experienceId - The parent experience ID
 * @param stepId - The step ID
 * @returns The step document or NOT_FOUND error
 */
declare function getStepAction(
  experienceId: string,
  stepId: string
): Promise<ActionResponse<Step>>;

/**
 * Create a new step
 *
 * @param input - Step creation input
 * @returns The created step
 *
 * Behavior:
 * - Validates input against CreateStepInput schema
 * - Checks MAX_STEPS limit (50)
 * - Creates step document in /experiences/{experienceId}/steps/
 * - Appends step ID to experience.stepsOrder
 * - Uses Firestore batch write for atomicity
 */
declare function createStepAction(
  input: CreateStepInput
): Promise<ActionResponse<Step>>;

/**
 * Update an existing step
 *
 * @param experienceId - The parent experience ID
 * @param stepId - The step ID
 * @param input - Fields to update
 * @returns The updated step
 *
 * Behavior:
 * - Validates input against UpdateStepInput schema
 * - Only updates provided fields
 * - Updates updatedAt timestamp
 */
declare function updateStepAction(
  experienceId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ActionResponse<Step>>;

/**
 * Delete a step
 *
 * @param experienceId - The parent experience ID
 * @param stepId - The step ID
 * @returns Success or error
 *
 * Behavior:
 * - Removes step document
 * - Removes step ID from experience.stepsOrder
 * - Uses Firestore batch write for atomicity
 */
declare function deleteStepAction(
  experienceId: string,
  stepId: string
): Promise<ActionResponse<void>>;

/**
 * Reorder steps within an experience
 *
 * @param experienceId - The parent experience ID
 * @param newOrder - Array of step IDs in new order
 * @returns Success or error
 *
 * Behavior:
 * - Validates all step IDs exist
 * - Updates experience.stepsOrder atomically
 */
declare function reorderStepsAction(
  experienceId: string,
  newOrder: string[]
): Promise<ActionResponse<void>>;

/**
 * Duplicate an existing step
 *
 * @param experienceId - The parent experience ID
 * @param stepId - The step ID to duplicate
 * @returns The duplicated step
 *
 * Behavior:
 * - Creates copy of step with new ID
 * - Inserts after original in stepsOrder
 * - Appends " (copy)" to title if present
 */
declare function duplicateStepAction(
  experienceId: string,
  stepId: string
): Promise<ActionResponse<Step>>;

// ============================================================================
// TYPES REFERENCE (from step.types.ts)
// ============================================================================

type StepType =
  | "info"
  | "experience-picker"
  | "capture"
  | "ai-transform"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward";

type MediaType = "image" | "gif" | "video" | "lottie";

interface Step {
  id: string;
  experienceId: string;
  type: StepType;
  title: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  ctaLabel: string | null;
  config: StepConfig;
  createdAt: number;
  updatedAt: number;
}

// StepConfig is a union type - see data-model.md for full definition
type StepConfig = Record<string, unknown>;
