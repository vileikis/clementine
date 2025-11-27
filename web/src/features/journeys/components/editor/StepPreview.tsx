"use client";

/**
 * Component: StepPreview
 *
 * Renders a live preview of the selected step within a SimulatorScreen.
 * Wraps step content with EventThemeProvider to apply the event's theme.
 * Routes to the appropriate step preview component based on step type.
 */

import { memo } from "react";
import { EventThemeProvider } from "@/components/providers/EventThemeProvider";
import {
  SimulatorScreen,
  InfoStep,
  ShortTextStep,
  LongTextStep,
  MultipleChoiceStep,
  YesNoStep,
  OpinionScaleStep,
  EmailStep,
  ExperiencePickerStep,
  CaptureStep,
  ProcessingStep,
  RewardStep,
} from "@/features/steps/components/preview";
import type { Step } from "@/features/steps/types";
import type { EventTheme } from "@/features/events/types";
import type { Experience } from "@/features/experiences/types";

interface StepPreviewProps {
  step: Step;
  theme: EventTheme;
  experiences: Experience[];
}

/**
 * Routes to the appropriate step preview component based on step type.
 * Memoized to prevent unnecessary re-renders.
 */
export const StepPreview = memo(function StepPreview({
  step,
  theme,
  experiences,
}: StepPreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <SimulatorScreen>
        <StepContent step={step} experiences={experiences} />
      </SimulatorScreen>
    </EventThemeProvider>
  );
});

/**
 * Internal component that renders the step content based on type.
 * Uses discriminated union pattern for type-safe rendering.
 */
function StepContent({
  step,
  experiences,
}: {
  step: Step;
  experiences: Experience[];
}) {
  switch (step.type) {
    case "info":
      return <InfoStep step={step} />;
    case "short_text":
      return <ShortTextStep step={step} />;
    case "long_text":
      return <LongTextStep step={step} />;
    case "multiple_choice":
      return <MultipleChoiceStep step={step} />;
    case "yes_no":
      return <YesNoStep step={step} />;
    case "opinion_scale":
      return <OpinionScaleStep step={step} />;
    case "email":
      return <EmailStep step={step} />;
    case "experience-picker":
      return <ExperiencePickerStep step={step} experiences={experiences} />;
    case "capture":
      return <CaptureStep step={step} experiences={experiences} />;
    case "processing":
      return <ProcessingStep step={step} />;
    case "reward":
      return <RewardStep step={step} />;
    default: {
      // TypeScript exhaustive check
      const _exhaustive: never = step;
      return <PlaceholderStep title="Unknown" type={(_exhaustive as Step).type} />;
    }
  }
}

/**
 * Placeholder component for step types not yet implemented.
 */
function PlaceholderStep({ title, type }: { title: string; type: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="text-lg font-medium mb-2">{title}</div>
      <div className="text-sm opacity-60">
        Preview for &quot;{type}&quot; steps will be available in a future phase.
      </div>
    </div>
  );
}
