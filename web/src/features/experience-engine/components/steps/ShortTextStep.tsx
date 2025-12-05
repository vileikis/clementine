"use client";

// ============================================================================
// ShortTextStep Renderer
// ============================================================================
// Renders short text input step for Experience Engine.
// Single-line text input with character limit.

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepShortText } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type ShortTextStepProps = StepRendererProps<StepShortText>;

export function ShortTextStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onCtaClick,
}: ShortTextStepProps) {
  // Extract current text value
  const textValue = currentValue?.type === "text" ? currentValue.value : "";

  const handleChange = (value: string) => {
    onChange({ type: "text", value });
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

      <TextInput
        placeholder={step.config.placeholder || "Enter your answer..."}
        maxLength={step.config.maxLength}
        required={step.config.required}
        value={isInteractive ? textValue : undefined}
        onChange={isInteractive ? handleChange : undefined}
      />
    </StepLayout>
  );
}
