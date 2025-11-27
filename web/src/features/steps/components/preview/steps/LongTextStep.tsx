"use client";

/**
 * Preview: LongTextStep
 *
 * Preview for Long Text input step type.
 * Displays title, description, a textarea field, and CTA button.
 * Supports interactive mode for playback with value persistence.
 */

import { StepLayout, ActionButton, TextArea } from "@/components/step-primitives";
import type { StepLongText } from "@/features/steps/types";

interface LongTextStepProps {
  step: StepLongText;
  /** Enable interactive input (playback mode) */
  isInteractive?: boolean;
  /** Current input value (controlled) */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
}

export function LongTextStep({
  step,
  isInteractive = false,
  value = "",
  onValueChange,
  onCtaClick,
}: LongTextStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        <TextArea
          placeholder={step.config.placeholder || "Share your thoughts..."}
          maxLength={step.config.maxLength}
          required={step.config.required}
          rows={4}
          value={isInteractive ? value : undefined}
          onChange={isInteractive ? onValueChange : undefined}
        />
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
