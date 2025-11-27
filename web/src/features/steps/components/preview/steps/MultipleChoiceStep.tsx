"use client";

/**
 * Preview: MultipleChoiceStep
 *
 * Preview for Multiple Choice step type.
 * Displays title, description, option buttons, and CTA button.
 * Supports interactive mode for playback with selection persistence.
 */

import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types";

interface MultipleChoiceStepProps {
  step: StepMultipleChoice;
  /** Enable interactive selection (playback mode) */
  isInteractive?: boolean;
  /** Currently selected option value */
  selectedValue?: string;
  /** Callback when selection changes */
  onValueChange?: (value: string) => void;
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
}

export function MultipleChoiceStep({
  step,
  isInteractive = false,
  selectedValue,
  onValueChange,
  onCtaClick,
}: MultipleChoiceStepProps) {
  const handleOptionClick = (value: string) => {
    if (isInteractive) {
      onValueChange?.(value);
    }
  };

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
            <OptionButton
              key={option.value || index}
              selected={selectedValue === option.value}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
