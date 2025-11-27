"use client";

/**
 * Preview: EmailStep
 *
 * Preview for Email input step type.
 * Displays title, description, an email input field, and CTA button.
 * Supports interactive mode for playback with value persistence.
 */

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepEmail } from "@/features/steps/types";

interface EmailStepProps {
  step: StepEmail;
  /** Enable interactive input (playback mode) */
  isInteractive?: boolean;
  /** Current input value (controlled) */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
}

export function EmailStep({
  step,
  isInteractive = false,
  value = "",
  onValueChange,
  onCtaClick,
}: EmailStepProps) {
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
          type="email"
          placeholder={step.config.placeholder || "email@example.com"}
          required={step.config.required}
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
