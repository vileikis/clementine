// ============================================================================
// Step Registry
// ============================================================================
// Maps step types to their renderer components.

import type { ComponentType } from "react";
import type { StepType, Step } from "@/features/steps/types";
import type { StepRendererProps } from "../types";

import { InfoStep } from "../components/steps/InfoStep";
import { ShortTextStep } from "../components/steps/ShortTextStep";
import { LongTextStep } from "../components/steps/LongTextStep";
import { EmailStep } from "../components/steps/EmailStep";
import { MultipleChoiceStep } from "../components/steps/MultipleChoiceStep";
import { OpinionScaleStep } from "../components/steps/OpinionScaleStep";
import { YesNoStep } from "../components/steps/YesNoStep";
import { CaptureStep } from "../components/steps/CaptureStep";
import { AiTransformStep } from "../components/steps/AiTransformStep";
import { ProcessingStep } from "../components/steps/ProcessingStep";
import { RewardStep } from "../components/steps/RewardStep";

/**
 * Registry mapping step types to renderer components.
 * Note: We use a looser type here to allow the registry to work with all step types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const STEP_REGISTRY: Record<StepType, ComponentType<StepRendererProps<any>>> = {
  info: InfoStep,
  capture: CaptureStep,
  "ai-transform": AiTransformStep,
  short_text: ShortTextStep,
  long_text: LongTextStep,
  multiple_choice: MultipleChoiceStep,
  yes_no: YesNoStep,
  opinion_scale: OpinionScaleStep,
  email: EmailStep,
  processing: ProcessingStep,
  reward: RewardStep,
  // Deprecated - not used in new flows, renders nothing
  "experience-picker": () => null,
};

/**
 * Get the renderer component for a given step type.
 * @param stepType - The type of step to render
 * @returns The React component for rendering the step
 * @throws Error if no component is registered for the step type
 */
export function getStepComponent<T extends Step>(
  stepType: StepType
): ComponentType<StepRendererProps<T>> {
  const StepComponent = STEP_REGISTRY[stepType];
  if (!StepComponent) {
    throw new Error(`No component registered for step type: ${stepType}`);
  }
  return StepComponent as ComponentType<StepRendererProps<T>>;
}
