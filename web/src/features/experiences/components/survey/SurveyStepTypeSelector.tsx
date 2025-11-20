"use client";

/**
 * Component: SurveyStepTypeSelector
 *
 * Dialog for selecting a survey step type when creating a new step.
 * Mobile-optimized with large tappable options (≥44x44px).
 *
 * Part of 001-survey-experience implementation (Phase 3 - User Story 1).
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ListChecks,
  CheckCircle,
  Scale,
  Type,
  AlignLeft,
  Mail,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyStepTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeSelected: (type: string) => void;
  loading?: boolean;
}

const STEP_TYPES = [
  {
    type: "multiple_choice",
    label: "Multiple Choice",
    description: "Let guests select one or more options from a list",
    icon: ListChecks,
  },
  {
    type: "yes_no",
    label: "Yes/No",
    description: "Binary choice with customizable labels",
    icon: CheckCircle,
  },
  {
    type: "opinion_scale",
    label: "Opinion Scale",
    description: "Numeric rating scale (e.g., 1-5, 0-10)",
    icon: Scale,
  },
  {
    type: "short_text",
    label: "Short Text",
    description: "Single-line text input for brief responses",
    icon: Type,
  },
  {
    type: "long_text",
    label: "Long Text",
    description: "Multi-line text area for detailed responses",
    icon: AlignLeft,
  },
  {
    type: "email",
    label: "Email",
    description: "Email input with validation",
    icon: Mail,
  },
  {
    type: "statement",
    label: "Statement",
    description: "Display-only step with no input",
    icon: FileText,
  },
] as const;

export function SurveyStepTypeSelector({
  open,
  onOpenChange,
  onTypeSelected,
  loading = false,
}: SurveyStepTypeSelectorProps) {
  const handleSelect = (type: string) => {
    if (!loading) {
      onTypeSelected(type);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Question Type</DialogTitle>
          <DialogDescription>
            Choose the type of question you want to add to your survey
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {STEP_TYPES.map(({ type, label, description, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              disabled={loading}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all",
                "min-h-[88px] touch-manipulation", // Mobile-first: ≥44px touch target
                "hover:border-primary hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-left"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {description}
              </p>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">Creating step...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
