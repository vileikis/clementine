"use client";

/**
 * Component: PreviewRuntime
 *
 * A runtime wrapper that provides mock session context for step previews.
 * Wraps DeviceFrame with theme and mock data injection.
 *
 * Used in the Journey Editor to render step previews with viewport mode support.
 */

import { EventThemeProvider } from "@/components/providers/EventThemeProvider";
import { DeviceFrame } from "./DeviceFrame";
import type { Step } from "@/features/steps/types";
import type { EventTheme } from "@/features/events/types";
import type { Experience } from "@/features/experiences/types";
import {
  ViewportMode,
  MockSessionData,
  DEFAULT_MOCK_SESSION,
} from "../../types/preview.types";

import {
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
} from "./steps";

interface PreviewRuntimeProps {
  step: Step;
  theme: EventTheme;
  viewportMode: ViewportMode;
  experiences?: Experience[];
  mockSession?: Partial<MockSessionData>;
}

export function PreviewRuntime({
  step,
  theme,
  viewportMode,
  experiences = [],
  mockSession,
}: PreviewRuntimeProps) {
  // Merge provided mock data with defaults
  const session: MockSessionData = {
    ...DEFAULT_MOCK_SESSION,
    ...mockSession,
  };

  return (
    <EventThemeProvider theme={theme}>
      <div className="h-full w-full flex justify-center">
        <DeviceFrame viewportMode={viewportMode}>
          <StepContent
            step={step}
            experiences={experiences}
            mockSession={session}
          />
        </DeviceFrame>
      </div>
    </EventThemeProvider>
  );
}

/**
 * Internal component that renders the step content based on type.
 * Uses discriminated union pattern for type-safe rendering.
 * Passes mockSession to components that need it for realistic preview.
 */
function StepContent({
  step,
  experiences,
  mockSession,
}: {
  step: Step;
  experiences: Experience[];
  mockSession: MockSessionData;
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
      return <CaptureStep step={step} experiences={experiences} mockSession={mockSession} />;
    case "processing":
      return <ProcessingStep step={step} />;
    case "reward":
      return <RewardStep step={step} mockSession={mockSession} />;
    default: {
      // TypeScript exhaustive check
      const _exhaustive: never = step;
      return (
        <PlaceholderStep title="Unknown" type={(_exhaustive as Step).type} />
      );
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
        Preview for &quot;{type}&quot; steps will be available in a future
        phase.
      </div>
    </div>
  );
}
