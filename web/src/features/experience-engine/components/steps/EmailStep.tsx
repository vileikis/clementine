"use client";

// ============================================================================
// EmailStep Renderer
// ============================================================================
// Renders email input step for Experience Engine.
// Email address collection with validation.

import { StepLayout, ActionButton, TextInput } from "@/components/step-primitives";
import type { StepEmail } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type EmailStepProps = StepRendererProps<StepEmail>;

export function EmailStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onCtaClick,
}: EmailStepProps) {
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
        type="email"
        placeholder={step.config.placeholder || "Enter your email..."}
        required={step.config.required}
        value={isInteractive ? textValue : undefined}
        onChange={isInteractive ? handleChange : undefined}
      />
    </StepLayout>
  );
}
