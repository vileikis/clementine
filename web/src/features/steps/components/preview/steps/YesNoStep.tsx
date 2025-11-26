"use client";

/**
 * Preview: YesNoStep
 *
 * Read-only preview for Yes/No step type.
 * Displays title, description, and two option buttons.
 */

import { StepLayout, OptionButton } from "@/components/step-primitives";
import type { StepYesNo } from "@/features/steps/types";

interface YesNoStepProps {
  step: StepYesNo;
}

export function YesNoStep({ step }: YesNoStepProps) {
  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        <div className="space-y-2">
          <OptionButton>{step.config.yesLabel}</OptionButton>
          <OptionButton>{step.config.noLabel}</OptionButton>
        </div>
      </div>
    </StepLayout>
  );
}
