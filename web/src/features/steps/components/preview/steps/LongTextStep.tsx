"use client";

/**
 * Preview: LongTextStep
 *
 * Read-only preview for Long Text input step type.
 * Displays title, description, a textarea field, and CTA button.
 */

import { StepLayout, ActionButton, TextArea } from "@/components/step-primitives";
import type { StepLongText } from "@/features/steps/types";

interface LongTextStepProps {
  step: StepLongText;
}

export function LongTextStep({ step }: LongTextStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
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
