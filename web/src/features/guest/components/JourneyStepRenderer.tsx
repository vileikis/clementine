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
  onStepComplete: () => void;
  onInputChange: (stepId: string, value: StepInputValue) => void;
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
  onStepComplete,
  onInputChange,
}: JourneyStepRendererProps) {
  // Helper to extract text value from input
  const getTextValue = (stepId: string): string => {
    // For now, we don't have access to previous inputs in this component
    // Input persistence is handled via saveInput callback
    return "";
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

  // Render other step types directly (no device frame)
  switch (step.type) {
    case "info":
      return <InfoStep step={step} onCtaClick={onStepComplete} />;

    case "short_text":
      return (
        <ShortTextStep
          step={step}
          isInteractive={true}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "text", value })
          }
          onCtaClick={onStepComplete}
        />
      );

    case "long_text":
      return (
        <LongTextStep
          step={step}
          isInteractive={true}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "text", value })
          }
          onCtaClick={onStepComplete}
        />
      );

    case "multiple_choice":
      return (
        <MultipleChoiceStep
          step={step}
          isInteractive={true}
          selectedValue={undefined}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "selection", selectedId: value })
          }
          onCtaClick={onStepComplete}
        />
      );

    case "yes_no":
      return (
        <YesNoStep
          step={step}
          isInteractive={true}
          selectedValue={undefined}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "boolean", value })
          }
        />
      );

    case "opinion_scale":
      return (
        <OpinionScaleStep
          step={step}
          isInteractive={true}
          selectedValue={undefined}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "number", value })
          }
          onCtaClick={onStepComplete}
        />
      );

    case "email":
      return (
        <EmailStep
          step={step}
          isInteractive={true}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange(step.id, { type: "text", value })
          }
          onCtaClick={onStepComplete}
        />
      );

    case "experience-picker":
      return (
        <ExperiencePickerStep
          step={step}
          experiences={experiences}
          isInteractive={true}
          selectedExperienceId={undefined}
          onValueChange={(experienceId) =>
            onInputChange(step.id, {
              type: "selection",
              selectedId: experienceId,
            })
          }
          onCtaClick={onStepComplete}
        />
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
