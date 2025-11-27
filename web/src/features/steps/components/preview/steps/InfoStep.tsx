"use client";

/**
 * Preview: InfoStep
 *
 * Read-only preview for Info step type.
 * Displays title, description, optional media, and CTA button.
 */

import { StepLayout, ActionButton } from "@/components/step-primitives";
import type { StepInfo } from "@/features/steps/types";

interface InfoStepProps {
  step: StepInfo;
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
}

export function InfoStep({ step, onCtaClick }: InfoStepProps) {
  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={step.ctaLabel && <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>}
    >
      {step.title && (
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
      )}
      {step.description && (
        <p className="text-sm opacity-80">{step.description}</p>
      )}
    </StepLayout>
  );
}
