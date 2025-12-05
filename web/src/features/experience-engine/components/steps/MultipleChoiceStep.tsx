"use client";

// ============================================================================
// MultipleChoiceStep Renderer
// ============================================================================
// Renders multiple choice step for Experience Engine.
// Selection from predefined options, supports single or multiple selection.

import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import type { StepMultipleChoice } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type MultipleChoiceStepProps = StepRendererProps<StepMultipleChoice>;

export function MultipleChoiceStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onCtaClick,
}: MultipleChoiceStepProps) {
  const options = step.config.options;
  const useGrid = options.length > 4;

  // Extract current selection(s)
  const selectedValue =
    currentValue?.type === "selection" ? currentValue.selectedId : undefined;
  const selectedValues =
    currentValue?.type === "selections" ? currentValue.selectedIds : [];

  const isSelected = (value: string) => {
    if (step.config.allowMultiple) {
      return selectedValues.includes(value);
    }
    return selectedValue === value;
  };

  const handleOptionClick = (value: string) => {
    if (!isInteractive) return;

    if (step.config.allowMultiple) {
      // Toggle selection in multi-select mode
      const newSelection = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange({ type: "selections", selectedIds: newSelection });
    } else {
      // Single selection mode
      onChange({ type: "selection", selectedId: value });
    }
  };

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={
        step.ctaLabel && <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
      }
    >
      {step.title && <h2 className="text-2xl font-bold mb-2">{step.title}</h2>}
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
          <OptionButton
            key={option.value || index}
            selected={isSelected(option.value)}
            onClick={() => handleOptionClick(option.value)}
          >
            {option.label}
          </OptionButton>
        ))}
      </div>
    </StepLayout>
  );
}
