"use client";

// ============================================================================
// LongTextStep Renderer
// ============================================================================
// Renders long text input step for Experience Engine.
// Multi-line textarea with character limit.

import { StepLayout, ActionButton, TextArea } from "@/components/step-primitives";
import type { StepLongText } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type LongTextStepProps = StepRendererProps<StepLongText>;

export function LongTextStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onCtaClick,
}: LongTextStepProps) {
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

      <TextArea
        placeholder={step.config.placeholder || "Enter your response..."}
        maxLength={step.config.maxLength}
        required={step.config.required}
        value={isInteractive ? textValue : undefined}
        onChange={isInteractive ? handleChange : undefined}
      />
    </StepLayout>
  );
}
