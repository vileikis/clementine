/**
 * Steps Hooks API Contract
 *
 * Feature: 017-steps-consolidate
 * Date: 2025-12-03
 *
 * These React hooks provide the client-side interface for step operations.
 * Location: web/src/features/experiences/hooks/
 */

// ============================================================================
// useSteps Hook
// ============================================================================

/**
 * Real-time subscription to steps for an experience
 *
 * @param experienceId - The parent experience ID (null to skip)
 * @returns Steps array and loading/error states
 *
 * Behavior:
 * - Subscribes to Firestore onSnapshot for real-time updates
 * - Returns steps ordered by experience.stepsOrder
 * - Automatically unsubscribes on unmount or experienceId change
 */
interface UseStepsReturn {
  steps: Step[];
  isLoading: boolean;
  error: Error | null;
}

declare function useSteps(experienceId: string | null): UseStepsReturn;

// ============================================================================
// useStepMutations Hook
// ============================================================================

/**
 * Step mutation operations with loading states and toast notifications
 *
 * @param experienceId - The parent experience ID
 * @returns Mutation functions with loading states
 *
 * Behavior:
 * - Wraps server actions with loading state management
 * - Shows toast notifications on success/error
 * - Imports actions from @/features/steps/actions (consolidated)
 */
interface UseStepMutationsReturn {
  // Create new step
  createStep: (input: CreateStepInput) => Promise<Step | null>;
  isCreating: boolean;

  // Update existing step
  updateStep: (stepId: string, input: UpdateStepInput) => Promise<Step | null>;
  isUpdating: boolean;

  // Delete step
  deleteStep: (stepId: string) => Promise<boolean>;
  isDeleting: boolean;

  // Reorder steps
  reorderSteps: (newOrder: string[]) => Promise<boolean>;
  isReordering: boolean;

  // Duplicate step
  duplicateStep: (stepId: string) => Promise<Step | null>;
  isDuplicating: boolean;
}

declare function useStepMutations(experienceId: string): UseStepMutationsReturn;

// ============================================================================
// useSelectedStep Hook
// ============================================================================

/**
 * Selected step state management for the experience editor
 *
 * @returns Selected step ID and setter
 *
 * Behavior:
 * - Stores selected step ID in component state
 * - Used by ExperienceEditor to highlight selected step
 * - Used by step editors to know which step to edit
 */
interface UseSelectedStepReturn {
  selectedStepId: string | null;
  setSelectedStepId: (id: string | null) => void;
}

declare function useSelectedStep(): UseSelectedStepReturn;

// ============================================================================
// TYPES REFERENCE
// ============================================================================

interface CreateStepInput {
  experienceId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  ctaLabel?: string | null;
  config?: StepConfig;
}

interface UpdateStepInput {
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  ctaLabel?: string | null;
  config?: StepConfig;
}

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

type StepConfig = Record<string, unknown>;
