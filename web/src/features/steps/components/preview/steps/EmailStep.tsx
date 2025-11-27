"use client";

/**
 * Preview: EmailStep
 *
 * Read-only preview for Email input step type.
 * Displays title, description, an email input field, and CTA button.
 */

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepEmail } from "@/features/steps/types";

interface EmailStepProps {
  step: StepEmail;
}

export function EmailStep({ step }: EmailStepProps) {
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
          type="email"
          placeholder={step.config.placeholder || "email@example.com"}
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
