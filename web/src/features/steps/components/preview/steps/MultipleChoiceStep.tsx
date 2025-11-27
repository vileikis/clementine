"use client";

/**
 * Preview: MultipleChoiceStep
 *
 * Read-only preview for Multiple Choice step type.
 * Displays title, description, option buttons, and CTA button.
 *
 * Responsive layout:
 * - Mobile: Single column stack
 * - Desktop (>4 options): 2-column grid
 */

import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types";

interface MultipleChoiceStepProps {
  step: StepMultipleChoice;
}

export function MultipleChoiceStep({ step }: MultipleChoiceStepProps) {
  const options = step.config.options;
  const useGrid = options.length > 4;

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={step.ctaLabel && <ActionButton>{step.ctaLabel}</ActionButton>}
    >
      {step.title && (
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
      )}
      {step.description && (
        <p className="text-sm opacity-80 mb-4">{step.description}</p>
      )}

      <div
        className={
          useGrid
            ? "space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0"
            : "space-y-2"
        }
      >
        {options.map((option, index) => (
          <OptionButton key={option.value || index}>
            {option.label}
          </OptionButton>
        ))}
      </div>
    </StepLayout>
  );
}
