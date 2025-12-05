// ============================================================================
// Renderer Types
// ============================================================================
// Types for step renderer components in the Experience Engine.

import type { ComponentType } from "react";
import type { Step, StepType } from "@/features/steps/types";
import type { SessionData, StepInputValue } from "@/features/sessions";
import type { TransformationStatus } from "@/features/sessions/types";

// ============================================================================
// Step Renderer Props
// ============================================================================

/**
 * Common props for all step renderer components.
 * Generic type T allows narrowing to specific step types.
 */
export interface StepRendererProps<T extends Step = Step> {
  /** Step configuration */
  step: T;

  /** Current session data */
  sessionData: SessionData;

  /** Current transformation status */
  transformStatus: TransformationStatus;

  /** Current input value for this step */
  currentValue?: StepInputValue;

  // === Session Context ===

  /** Session ID (for persisted mode operations) */
  sessionId?: string;

  // === Handlers ===

  /** Called when step input changes */
  onChange: (value: StepInputValue) => void;

  /** Called when CTA button is clicked */
  onCtaClick: () => void;

  /** Called to trigger auto-advance */
  onComplete: () => void;

  /** Called to skip step (if allowed) */
  onSkip: () => void;

  // === Flags ===

  /** Whether step is interactive (accepts input) */
  isInteractive: boolean;

  /** Whether step is currently loading */
  isLoading: boolean;
}

// ============================================================================
// Renderer Registry
// ============================================================================

/**
 * Registry mapping step types to renderer components.
 * Ensures type-safe component lookup.
 */
export type RendererRegistry = {
  [K in StepType]: ComponentType<StepRendererProps<Extract<Step, { type: K }>>>;
};
