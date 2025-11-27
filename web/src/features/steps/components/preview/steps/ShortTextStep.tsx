"use client";

/**
 * Preview: ShortTextStep
 *
 * Read-only preview for Short Text input step type.
 * Displays title, description, a text input field, and CTA button.
 */

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepShortText } from "@/features/steps/types";

interface ShortTextStepProps {
  step: StepShortText;
}

export function ShortTextStep({ step }: ShortTextStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
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
