"use client";

import type { Step } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";
import type { StepInputValue } from "@/features/sessions";
import { GuestCaptureStep } from "./GuestCaptureStep";
import { GuestProcessingStep } from "./GuestProcessingStep";
import { GuestRewardStep } from "./GuestRewardStep";
import {
  InfoStep,
  ShortTextStep,
  LongTextStep,
  MultipleChoiceStep,
  YesNoStep,
  OpinionScaleStep,
  EmailStep,
  ExperiencePickerStep,
} from "@/features/steps/components/preview/steps";

interface JourneyStepRendererProps {
  step: Step;
  experiences?: Experience[];
  sessionId: string;
  eventId: string;
  inputValues?: Record<string, StepInputValue>;
  textDrafts?: Record<string, string>;
  validationErrors?: Record<string, string>;
  onStepComplete: () => void;
  onInputChange: (stepId: string, value: StepInputValue) => void;
  onTextDraftChange: (variableName: string, value: string) => void;
}

/**
 * Journey step renderer - routes step types to appropriate components
 *
 * Renders steps directly without device frame wrapper for full-viewport guest experience.
 *
 * Special handling for:
 * - capture: Real camera via GuestCaptureStep
 * - processing: AI transform trigger via GuestProcessingStep
 * - reward: Result display via GuestRewardStep
 *
 * All other step types render directly without device frame
 */
export function JourneyStepRenderer({
  step,
  experiences = [],
  sessionId,
  eventId,
  inputValues = {},
  textDrafts = {},
  validationErrors = {},
  onStepComplete,
  onInputChange,
  onTextDraftChange,
}: JourneyStepRendererProps) {
  // Helper to get the variable name (storage key) for a step
  const getVariableName = (currentStep: Step): string => {
    // Steps with config.variable field
    if (
      currentStep.type === "short_text" ||
      currentStep.type === "long_text" ||
      currentStep.type === "email" ||
      currentStep.type === "multiple_choice" ||
      currentStep.type === "yes_no" ||
      currentStep.type === "opinion_scale" ||
      currentStep.type === "experience-picker"
    ) {
      return currentStep.config.variable;
    }
    // Fallback to step ID for steps without variable
    return currentStep.id;
  };

  const variableName = getVariableName(step);

  // Helper to extract text value - checks draft first, then persisted values
  const getTextValue = (variable: string): string => {
    // Check draft state first (current editing session)
    if (textDrafts[variable] !== undefined) {
      return textDrafts[variable];
    }
    // Fall back to persisted value (from previous step or navigation back)
    const input = inputValues[variable];
    if (input && input.type === "text") {
      return input.value;
    }
    return "";
  };

  // Helper to extract number value from stored inputs
  const getNumberValue = (variable: string): number | undefined => {
    const input = inputValues[variable];
    if (input && input.type === "number") {
      return input.value;
    }
    return undefined;
  };

  // Helper to extract boolean value from stored inputs
  const getBooleanValue = (variable: string): boolean | undefined => {
    const input = inputValues[variable];
    if (input && input.type === "boolean") {
      return input.value;
    }
    return undefined;
  };

  // Helper to extract selection value from stored inputs
  const getSelectionValue = (variable: string): string | undefined => {
    const input = inputValues[variable];
    if (input && input.type === "selection") {
      return input.selectedId;
    }
    return undefined;
  };

  // Special handling for capture step - use real camera
  if (step.type === "capture") {
    return (
      <GuestCaptureStep
        step={step}
        eventId={eventId}
        sessionId={sessionId}
        onCaptureComplete={onStepComplete}
      />
    );
  }

  // Special handling for processing step - trigger AI transform
  if (step.type === "processing") {
    return (
      <GuestProcessingStep
        step={step}
        eventId={eventId}
        sessionId={sessionId}
        onProcessingComplete={onStepComplete}
      />
    );
  }

  // Special handling for reward step - display result
  if (step.type === "reward") {
    return (
      <GuestRewardStep
        step={step}
        eventId={eventId}
        sessionId={sessionId}
      />
    );
  }

  // Get validation error for current step (using variable name as key)
  const validationError = validationErrors[variableName];

  // Validation error display component
  const ErrorDisplay = validationError ? (
    <div className="fixed bottom-20 left-0 right-0 px-4 z-50">
      <div className="max-w-md mx-auto bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium">{validationError}</span>
      </div>
    </div>
  ) : null;

  // Render other step types directly (no device frame)
  switch (step.type) {
    case "info":
      return (
        <>
          <InfoStep step={step} onCtaClick={onStepComplete} />
          {ErrorDisplay}
        </>
      );

    case "short_text":
      return (
        <>
          <ShortTextStep
            step={step}
            isInteractive={true}
            value={getTextValue(variableName)}
            onValueChange={(value) => onTextDraftChange(variableName, value)}
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    case "long_text":
      return (
        <>
          <LongTextStep
            step={step}
            isInteractive={true}
            value={getTextValue(variableName)}
            onValueChange={(value) => onTextDraftChange(variableName, value)}
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    case "multiple_choice":
      return (
        <>
          <MultipleChoiceStep
            step={step}
            isInteractive={true}
            selectedValue={getSelectionValue(variableName)}
            onValueChange={(value) =>
              onInputChange(variableName, { type: "selection", selectedId: value })
            }
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    case "yes_no":
      return (
        <>
          <YesNoStep
            step={step}
            isInteractive={true}
            selectedValue={getBooleanValue(variableName)}
            onValueChange={(value) =>
              onInputChange(variableName, { type: "boolean", value })
            }
          />
          {ErrorDisplay}
        </>
      );

    case "opinion_scale":
      return (
        <>
          <OpinionScaleStep
            step={step}
            isInteractive={true}
            selectedValue={getNumberValue(variableName)}
            onValueChange={(value) =>
              onInputChange(variableName, { type: "number", value })
            }
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    case "email":
      return (
        <>
          <EmailStep
            step={step}
            isInteractive={true}
            value={getTextValue(variableName)}
            onValueChange={(value) => onTextDraftChange(variableName, value)}
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    case "experience-picker":
      return (
        <>
          <ExperiencePickerStep
            step={step}
            experiences={experiences}
            isInteractive={true}
            selectedExperienceId={getSelectionValue("selected_experience_id")}
            onValueChange={(experienceId) =>
              onInputChange("selected_experience_id", {
                type: "selection",
                selectedId: experienceId,
              })
            }
            onCtaClick={onStepComplete}
          />
          {ErrorDisplay}
        </>
      );

    default: {
      // TypeScript exhaustive check
      const _exhaustive: never = step;
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
          <div className="text-lg font-medium mb-2">Unknown Step Type</div>
          <div className="text-sm opacity-60">
            Step type &quot;{(_exhaustive as Step).type}&quot; is not supported.
          </div>
        </div>
      );
    }
  }
}
