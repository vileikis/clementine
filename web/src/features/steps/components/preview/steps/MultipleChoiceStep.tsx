"use client";

/**
 * Preview: MultipleChoiceStep
 *
 * Read-only preview for Multiple Choice step type.
 * Displays title, description, option buttons, and CTA button.
 */

import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types";

interface MultipleChoiceStepProps {
  step: StepMultipleChoice;
}

export function MultipleChoiceStep({ step }: MultipleChoiceStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        <div className="space-y-2">
          {step.config.options.map((option, index) => (
            <OptionButton key={option.value || index}>
              {option.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
