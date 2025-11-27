"use client";

/**
 * Preview: ShortTextStep
 *
 * Preview for Short Text input step type.
 * Displays title, description, a text input field, and CTA button.
 * Supports interactive mode for playback with value persistence.
 */

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepShortText } from "@/features/steps/types";

interface ShortTextStepProps {
  step: StepShortText;
  /** Enable interactive input (playback mode) */
  isInteractive?: boolean;
  /** Current input value (controlled) */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
}

export function ShortTextStep({
  step,
  isInteractive = false,
  value = "",
  onValueChange,
}: ShortTextStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        <TextInput
          placeholder={step.config.placeholder || "Enter your answer..."}
          maxLength={step.config.maxLength}
          required={step.config.required}
          value={isInteractive ? value : undefined}
          onChange={isInteractive ? onValueChange : undefined}
        />
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
