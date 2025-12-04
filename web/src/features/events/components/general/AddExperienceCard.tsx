"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddExperienceCardProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Card component for adding a new experience to an event.
 * Displays a plus icon that opens the experience picker drawer.
 */
export function AddExperienceCard({ onClick, disabled }: AddExperienceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center",
        "min-h-[120px] w-full rounded-lg border-2 border-dashed",
        "transition-colors duration-200",
        "hover:border-primary hover:bg-primary/5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground">
        Add Experience
      </span>
    </button>
  );
}
