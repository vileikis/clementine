"use client";

/**
 * Component: SurveyStepPreview
 *
 * Real-time preview of survey step configuration matching guest-facing design.
 * Updates immediately as creator configures step settings.
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SurveyStep } from "../../lib/schemas";
import { cn } from "@/lib/utils";

interface SurveyStepPreviewProps {
  step: SurveyStep;
}

export function SurveyStepPreview({ step }: SurveyStepPreviewProps) {
  // Show button for text input steps and statement
  const showButton =
    step.type === "short_text" ||
    step.type === "long_text" ||
    step.type === "email" ||
    step.type === "statement";

  return (
    <div className="flex h-full min-h-[600px] w-full flex-col items-center justify-center border rounded-lg bg-background p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Step Title */}
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-foreground">
            {step.title || "Question title"}
            {step.required && <span className="text-destructive ml-1">*</span>}
          </h4>
          {step.description && (
            <p className="text-sm text-muted-foreground">{step.description}</p>
          )}
        </div>

        {/* Type-Specific Preview */}
        {renderStepPreview(step)}

        {/* CTA Button - for text input steps and statement */}
        {showButton && (
          <div className="flex justify-start">
            <Button className="min-h-[44px] px-8">
              {step.ctaLabel || "Continue"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render type-specific preview based on step.type
 */
function renderStepPreview(step: SurveyStep) {
  switch (step.type) {
    case "multiple_choice":
      return (
        <div className="space-y-2">
          {step.config.options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 border rounded-lg"
            >
              {step.config.allowMultiple ? (
                <Checkbox id={`option-${index}`} disabled />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-primary" />
              )}
              <Label
                htmlFor={`option-${index}`}
                className="flex-1 cursor-pointer"
              >
                {option || `Option ${index + 1}`}
              </Label>
            </div>
          ))}
        </div>
      );

    case "yes_no":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="min-h-[44px]" disabled>
            {step.config?.yesLabel || "Yes"}
          </Button>
          <Button variant="outline" className="min-h-[44px]" disabled>
            {step.config?.noLabel || "No"}
          </Button>
        </div>
      );

    case "opinion_scale":
      const { scaleMin, scaleMax, minLabel, maxLabel } = step.config;
      const scaleItems = [];
      for (let i = scaleMin; i <= scaleMax; i++) {
        scaleItems.push(i);
      }

      return (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {scaleItems.map((value) => (
              <button
                key={value}
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-lg border-2 font-semibold",
                  "hover:border-primary hover:bg-primary/5 transition-colors",
                  "disabled:opacity-50"
                )}
                disabled
              >
                {value}
              </button>
            ))}
          </div>
          {(minLabel || maxLabel) && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{minLabel || ""}</span>
              <span>{maxLabel || ""}</span>
            </div>
          )}
        </div>
      );

    case "short_text":
      return (
        <Input
          placeholder={step.config?.placeholder || "Your answer"}
          className="min-h-[44px]"
          disabled
        />
      );

    case "long_text":
      return (
        <Textarea
          placeholder={step.config?.placeholder || "Your answer"}
          rows={4}
          className="resize-none"
          disabled
        />
      );

    case "email":
      return (
        <Input
          type="email"
          placeholder={step.config?.placeholder || "your@email.com"}
          className="min-h-[44px]"
          disabled
        />
      );

    case "statement":
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground italic">
            This is a display-only step (no input required)
          </p>
        </div>
      );

    default:
      // Exhaustive check for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = step;
      return null;
  }
}
