"use client";

/**
 * Component: PreviewRuntime
 *
 * A runtime wrapper that provides mock session context for step previews.
 * Wraps DeviceFrame with theme and mock data injection.
 *
 * Used in the Experience Editor to render step previews with viewport mode support.
 * Supports two modes:
 * - "single-step": Read-only preview (default, for editor panel)
 * - "playback": Interactive mode with value persistence (for experience playback)
 */

import { ThemeProvider, ThemedBackground } from "@/features/theming";
import {
  DeviceFrame,
  ViewportProvider,
  type ViewportMode,
} from "@/features/preview-shell";
import type { Step } from "@/features/steps/types";
import type { Theme } from "@/features/theming";
import type { AiPreset } from "@/features/ai-presets/types";
import { MockSessionData, DEFAULT_MOCK_SESSION } from "../../types/preview.types";
import type { StepInputValue, PlaybackMockSession } from "../../types/playback.types";

import {
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
} from "./steps";

/** Preview mode */
export type PreviewMode = "single-step" | "playback";

interface PreviewRuntimeProps {
  step: Step;
  theme: Theme;
  viewportMode: ViewportMode;
  aiPresets?: AiPreset[];
  mockSession?: Partial<MockSessionData>;
  /** Preview mode: "single-step" (read-only) or "playback" (interactive) */
  mode?: PreviewMode;
  /** Playback session with collected inputs (only used in playback mode) */
  playbackSession?: PlaybackMockSession;
  /** Callback when step input value changes (only used in playback mode) */
  onInputChange?: (stepId: string, value: StepInputValue) => void;
  /** Callback when CTA button is clicked (only used in playback mode) */
  onCtaClick?: () => void;
  /** Callback when step is complete for auto-advance (Capture, Processing steps) */
  onStepComplete?: (stepId: string) => void;
  /** Whether to render the DeviceFrame wrapper. Default: true. Set to false when used inside PreviewShell. */
  renderFrame?: boolean;
}

export function PreviewRuntime({
  step,
  theme,
  viewportMode,
  aiPresets = [],
  mockSession,
  mode = "single-step",
  playbackSession,
  onInputChange,
  onCtaClick,
  onStepComplete,
  renderFrame = true,
}: PreviewRuntimeProps) {
  // Merge provided mock data with defaults
  const session: MockSessionData = {
    ...DEFAULT_MOCK_SESSION,
    ...mockSession,
  };

  const isInteractive = mode === "playback";

  // Step content with themed background
  const content = (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="h-full w-full"
    >
      <StepContent
        step={step}
        aiPresets={aiPresets}
        mockSession={session}
        isInteractive={isInteractive}
        playbackSession={playbackSession}
        onInputChange={onInputChange}
        onCtaClick={isInteractive ? onCtaClick : undefined}
        onStepComplete={isInteractive ? onStepComplete : undefined}
      />
    </ThemedBackground>
  );

  return (
    <ThemeProvider theme={theme}>
      <ViewportProvider mode={viewportMode}>
        <div className="h-full w-full flex justify-center">
          {renderFrame ? (
            <DeviceFrame viewportMode={viewportMode}>{content}</DeviceFrame>
          ) : (
            content
          )}
        </div>
      </ViewportProvider>
    </ThemeProvider>
  );
}

/**
 * Internal component that renders the step content based on type.
 * Uses discriminated union pattern for type-safe rendering.
 * Passes mockSession to components that need it for realistic preview.
 * In playback mode, passes interactive props for value persistence.
 */
function StepContent({
  step,
  aiPresets,
  mockSession,
  isInteractive,
  playbackSession,
  onInputChange,
  onCtaClick,
  onStepComplete,
}: {
  step: Step;
  aiPresets: AiPreset[];
  mockSession: MockSessionData;
  isInteractive: boolean;
  playbackSession?: PlaybackMockSession;
  onInputChange?: (stepId: string, value: StepInputValue) => void;
  onCtaClick?: () => void;
  onStepComplete?: (stepId: string) => void;
}) {
  // Helper to get current input value for a step
  const getInputValue = (stepId: string) => playbackSession?.inputs[stepId];

  // Helper to extract text value from input
  const getTextValue = (stepId: string): string => {
    const input = getInputValue(stepId);
    return input?.type === "text" ? input.value : "";
  };

  // Helper to extract selection value
  const getSelectionValue = (stepId: string): string | undefined => {
    const input = getInputValue(stepId);
    return input?.type === "selection" ? input.selectedId : undefined;
  };

  // Helper to extract boolean value
  const getBooleanValue = (stepId: string): boolean | undefined => {
    const input = getInputValue(stepId);
    return input?.type === "boolean" ? input.value : undefined;
  };

  // Helper to extract number value
  const getNumberValue = (stepId: string): number | undefined => {
    const input = getInputValue(stepId);
    return input?.type === "number" ? input.value : undefined;
  };

  switch (step.type) {
    case "info":
      return <InfoStep step={step} onCtaClick={onCtaClick} />;

    case "short_text":
      return (
        <ShortTextStep
          step={step}
          isInteractive={isInteractive}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "text", value })
          }
          onCtaClick={onCtaClick}
        />
      );

    case "long_text":
      return (
        <LongTextStep
          step={step}
          isInteractive={isInteractive}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "text", value })
          }
          onCtaClick={onCtaClick}
        />
      );

    case "multiple_choice":
      return (
        <MultipleChoiceStep
          step={step}
          isInteractive={isInteractive}
          selectedValue={getSelectionValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "selection", selectedId: value })
          }
          onCtaClick={onCtaClick}
        />
      );

    case "yes_no":
      return (
        <YesNoStep
          step={step}
          isInteractive={isInteractive}
          selectedValue={getBooleanValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "boolean", value })
          }
        />
      );

    case "opinion_scale":
      return (
        <OpinionScaleStep
          step={step}
          isInteractive={isInteractive}
          selectedValue={getNumberValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "number", value })
          }
          onCtaClick={onCtaClick}
        />
      );

    case "email":
      return (
        <EmailStep
          step={step}
          isInteractive={isInteractive}
          value={getTextValue(step.id)}
          onValueChange={(value) =>
            onInputChange?.(step.id, { type: "text", value })
          }
          onCtaClick={onCtaClick}
        />
      );

    case "capture":
      return (
        <CaptureStep
          step={step}
          aiPresets={aiPresets}
          mockSession={mockSession}
          onCtaClick={onCtaClick}
          isInteractive={isInteractive}
          onComplete={() => onStepComplete?.(step.id)}
        />
      );

    case "processing":
      return (
        <ProcessingStep
          step={step}
          isInteractive={isInteractive}
          onComplete={() => onStepComplete?.(step.id)}
        />
      );

    case "reward":
      return <RewardStep step={step} mockSession={mockSession} onCtaClick={onCtaClick} />;

    case "ai-transform":
      return <PlaceholderStep title="AI Transform" type={step.type} />;

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
