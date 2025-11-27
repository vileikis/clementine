"use client";

/**
 * Preview: YesNoStep
 *
 * Preview for Yes/No step type.
 * Displays title, description, and two option buttons.
 * Supports interactive mode for playback with selection persistence.
 * No CTA button - selection auto-advances.
 */

import { StepLayout, OptionButton } from "@/components/step-primitives";
import type { StepYesNo } from "@/features/steps/types";

interface YesNoStepProps {
  step: StepYesNo;
  /** Enable interactive selection (playback mode) */
  isInteractive?: boolean;
  /** Currently selected value (true = yes, false = no) */
  selectedValue?: boolean;
  /** Callback when selection changes */
  onValueChange?: (value: boolean) => void;
}

export function YesNoStep({
  step,
  isInteractive = false,
  selectedValue,
  onValueChange,
}: YesNoStepProps) {
  const handleClick = (value: boolean) => {
    if (isInteractive) {
      onValueChange?.(value);
    }
  };

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      {step.title && (
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
      )}
      {step.description && (
        <p className="text-sm opacity-80 mb-4">{step.description}</p>
      )}

      <div className="space-y-2">
        <OptionButton
          selected={selectedValue === true}
          onClick={() => handleClick(true)}
        >
          {step.config.yesLabel}
        </OptionButton>
        <OptionButton
          selected={selectedValue === false}
          onClick={() => handleClick(false)}
        >
          {step.config.noLabel}
        </OptionButton>
      </div>
    </StepLayout>
  );
}
