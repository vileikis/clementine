"use client";

/**
 * Preview: ExperiencePickerStep
 *
 * Read-only preview for Experience Picker step type.
 * Displays title, description, and experience options in the configured layout.
 */

import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepExperiencePicker } from "@/features/steps/types";

interface ExperiencePickerStepProps {
  step: StepExperiencePicker;
}

export function ExperiencePickerStep({ step }: ExperiencePickerStepProps) {
  const { layout, options } = step.config;

  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {options.length === 0 ? (
          <div className="text-center py-4 opacity-60">
            <p className="text-sm">No options configured</p>
          </div>
        ) : (
          <OptionsLayout layout={layout} options={options} />
        )}
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}

interface OptionsLayoutProps {
  layout: "grid" | "list" | "carousel";
  options: StepExperiencePicker["config"]["options"];
}

function OptionsLayout({ layout, options }: OptionsLayoutProps) {
  const { theme } = useEventTheme();

  switch (layout) {
    case "grid":
      return (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <GridOption key={option.id} option={option} theme={theme} />
          ))}
        </div>
      );

    case "list":
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <OptionButton key={option.id}>{option.label}</OptionButton>
          ))}
        </div>
      );

    case "carousel":
      return (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {options.map((option) => (
            <CarouselOption key={option.id} option={option} theme={theme} />
          ))}
        </div>
      );

    default:
      return null;
  }
}

interface OptionProps {
  option: StepExperiencePicker["config"]["options"][number];
  theme: ReturnType<typeof useEventTheme>["theme"];
}

function GridOption({ option, theme }: OptionProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center p-2 border-2 rounded-lg transition-colors aspect-square"
      style={{
        borderColor: theme.text.color + "40",
        color: theme.text.color,
      }}
    >
      {option.imageUrl ? (
        <div className="flex-1 w-full rounded overflow-hidden mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.label}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="flex-1 w-full rounded flex items-center justify-center mb-1"
          style={{ backgroundColor: theme.text.color + "10" }}
        >
          <span className="text-2xl opacity-40">?</span>
        </div>
      )}
      <span className="text-xs font-medium truncate w-full text-center">
        {option.label}
      </span>
    </button>
  );
}

function CarouselOption({ option, theme }: OptionProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center p-2 border-2 rounded-lg transition-colors shrink-0 w-24"
      style={{
        borderColor: theme.text.color + "40",
        color: theme.text.color,
      }}
    >
      {option.imageUrl ? (
        <div className="w-full h-16 rounded overflow-hidden mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.label}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full h-16 rounded flex items-center justify-center mb-1"
          style={{ backgroundColor: theme.text.color + "10" }}
        >
          <span className="text-2xl opacity-40">?</span>
        </div>
      )}
      <span className="text-xs font-medium truncate w-full text-center">
        {option.label}
      </span>
    </button>
  );
}
