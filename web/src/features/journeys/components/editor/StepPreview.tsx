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
} from "@/features/steps/components/preview";
import type { Step } from "@/features/steps/types";
import type { EventTheme } from "@/features/events/types";

interface StepPreviewProps {
  step: Step;
  theme: EventTheme;
}

/**
 * Routes to the appropriate step preview component based on step type.
 * Memoized to prevent unnecessary re-renders.
 */
export const StepPreview = memo(function StepPreview({
  step,
  theme,
}: StepPreviewProps) {
  return (
    <EventThemeProvider theme={theme}>
      <SimulatorScreen>
        <StepContent step={step} />
      </SimulatorScreen>
    </EventThemeProvider>
  );
});

/**
 * Internal component that renders the step content based on type.
 * Uses discriminated union pattern for type-safe rendering.
 */
function StepContent({ step }: { step: Step }) {
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
      return <ExperiencePickerStep step={step} />;
    case "capture":
      return <PlaceholderStep title="Capture" type={step.type} />;
    case "processing":
      return <PlaceholderStep title="Processing" type={step.type} />;
    case "reward":
      return <PlaceholderStep title="Reward" type={step.type} />;
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
