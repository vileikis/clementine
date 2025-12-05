"use client";

// ============================================================================
// YesNoStep Renderer
// ============================================================================
// Renders yes/no step for Experience Engine.
// Binary choice with customizable labels. Auto-advances on selection.

import { useEffect, useRef } from "react";
import { StepLayout, OptionButton } from "@/components/step-primitives";
import type { StepYesNo } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type YesNoStepProps = StepRendererProps<StepYesNo>;

export function YesNoStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onComplete,
}: YesNoStepProps) {
  // Extract current boolean value
  const selectedValue =
    currentValue?.type === "boolean" ? currentValue.value : undefined;

  // Track if we've auto-advanced to prevent multiple triggers
  const hasAutoAdvanced = useRef(false);

  const handleClick = (value: boolean) => {
    if (!isInteractive) return;
    onChange({ type: "boolean", value });
  };

  // Auto-advance when selection is made
  useEffect(() => {
    if (selectedValue !== undefined && isInteractive && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      // Small delay before auto-advancing
      const timer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedValue, isInteractive, onComplete]);

  // Reset auto-advance flag when step changes
  useEffect(() => {
    hasAutoAdvanced.current = false;
  }, [step.id]);

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      {step.title && <h2 className="text-2xl font-bold mb-2">{step.title}</h2>}
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
