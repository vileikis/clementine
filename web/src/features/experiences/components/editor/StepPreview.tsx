"use client";

/**
 * Component: StepPreview
 *
 * Renders a live preview of the selected step within a DeviceFrame.
 * Wraps step content with EventThemeProvider to apply the theme.
 * Routes to the appropriate step preview component based on step type.
 * Passes mockSession data to step components for realistic preview rendering.
 */

import { memo } from "react";
import { ThemeProvider } from "@/features/theming";
import {
  DeviceFrame,
  InfoStep,
  ShortTextStep,
  LongTextStep,
  MultipleChoiceStep,
  YesNoStep,
  OpinionScaleStep,
  EmailStep,
  CaptureStep,
  ProcessingStep,
  RewardStep,
} from "@/features/steps/components/preview";
import type { Step } from "@/features/steps/types";
import type { Theme } from "@/features/theming";
import type { AiPreset } from "@/features/ai-presets/types";
import { DEFAULT_MOCK_SESSION, type MockSessionData } from "@/features/steps/types/preview.types";

interface StepPreviewProps {
  step: Step;
  theme: Theme;
  aiPresets: AiPreset[];
  mockSession?: MockSessionData;
}

/**
 * Routes to the appropriate step preview component based on step type.
 * Memoized to prevent unnecessary re-renders.
 */
export const StepPreview = memo(function StepPreview({
  step,
  theme,
  aiPresets,
  mockSession = DEFAULT_MOCK_SESSION,
}: StepPreviewProps) {
  return (
    <ThemeProvider theme={theme}>
      <DeviceFrame>
        <StepContent step={step} aiPresets={aiPresets} mockSession={mockSession} />
      </DeviceFrame>
    </ThemeProvider>
  );
});

/**
 * Internal component that renders the step content based on type.
 * Uses discriminated union pattern for type-safe rendering.
 * Passes mockSession to components that need it for realistic preview.
 */
function StepContent({
  step,
  aiPresets,
  mockSession,
}: {
  step: Step;
  aiPresets: AiPreset[];
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
    
    case "capture":
      return <CaptureStep step={step} aiPresets={aiPresets} mockSession={mockSession} />;
    case "ai-transform":
      return <PlaceholderStep title="AI Transform" type={step.type} />;
    case "processing":
      return <ProcessingStep step={step} />;
    case "reward":
      return <RewardStep step={step} mockSession={mockSession} />;
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
