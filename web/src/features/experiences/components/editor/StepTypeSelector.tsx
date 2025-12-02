"use client";

/**
 * Component: StepTypeSelector
 *
 * Dialog for selecting a step type when creating a new step.
 * Organizes step types by category (Navigation, Capture, Input, Completion).
 * Mobile-optimized with ≥44px touch targets.
 * Filters out deprecated step types (experience-picker).
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Layout,
  Type,
  AlignLeft,
  ListChecks,
  ToggleLeft,
  Gauge,
  Mail,
  Loader2,
  Gift,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepType } from "@/features/steps/types";

interface StepTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeSelected: (type: StepType) => void;
  loading?: boolean;
}

interface StepTypeOption {
  type: StepType;
  label: string;
  description: string;
  icon: typeof Layout;
}

interface StepTypeCategory {
  name: string;
  types: StepTypeOption[];
}

const STEP_TYPE_CATEGORIES: StepTypeCategory[] = [
  {
    name: "Navigation",
    types: [
      {
        type: "info",
        label: "Info",
        description: "Welcome or message screen",
        icon: Layout,
      },
    ],
  },
  {
    name: "Capture",
    types: [
      {
        type: "capture",
        label: "Capture",
        description: "Photo or video capture",
        icon: Camera,
      },
    ],
  },
  {
    name: "Input",
    types: [
      {
        type: "short_text",
        label: "Short Text",
        description: "Single line text input",
        icon: Type,
      },
      {
        type: "long_text",
        label: "Long Text",
        description: "Multi-line text input",
        icon: AlignLeft,
      },
      {
        type: "multiple_choice",
        label: "Multiple Choice",
        description: "Select from options",
        icon: ListChecks,
      },
      {
        type: "yes_no",
        label: "Yes / No",
        description: "Binary choice",
        icon: ToggleLeft,
      },
      {
        type: "opinion_scale",
        label: "Opinion Scale",
        description: "Numeric rating scale",
        icon: Gauge,
      },
      {
        type: "email",
        label: "Email",
        description: "Collect email address",
        icon: Mail,
      },
    ],
  },
  {
    name: "Completion",
    types: [
      {
        type: "processing",
        label: "Processing",
        description: "Loading/generation screen",
        icon: Loader2,
      },
      {
        type: "reward",
        label: "Reward",
        description: "Final result with sharing",
        icon: Gift,
      },
    ],
  },
];

export function StepTypeSelector({
  open,
  onOpenChange,
  onTypeSelected,
  loading = false,
}: StepTypeSelectorProps) {
  const handleSelect = (type: StepType) => {
    if (!loading) {
      onTypeSelected(type);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
          <DialogDescription>
            Choose the type of step to add to your experience
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {STEP_TYPE_CATEGORIES.map((category) => (
            <div key={category.name}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.types.map(({ type, label, description, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => handleSelect(type)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all",
                      "min-h-[88px] touch-manipulation",
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
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Creating step...
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
