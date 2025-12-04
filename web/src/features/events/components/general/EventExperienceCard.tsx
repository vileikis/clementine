"use client";

import { AlertTriangle, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { EventExperienceLink } from "../../types/event.types";
import type { Experience } from "@/features/experiences";

interface EventExperienceCardProps {
  experienceLink: EventExperienceLink;
  experience: Experience | null;
  onToggle: (enabled: boolean) => void;
  onClick: () => void;
  isUpdating?: boolean;
}

/**
 * Card component displaying an attached experience with toggle control.
 * Shows experience name (or custom label) and enable/disable switch.
 * Click on card body opens edit drawer.
 */
export function EventExperienceCard({
  experienceLink,
  experience,
  onToggle,
  onClick,
  isUpdating,
}: EventExperienceCardProps) {
  const isNotFound = !experience;
  const displayName = experienceLink.label || experience?.name || "Experience not found";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border p-4",
        "transition-colors duration-200",
        experienceLink.enabled
          ? "bg-background"
          : "bg-muted/50 opacity-75",
        !isNotFound && "cursor-pointer hover:border-primary/50",
        isNotFound && "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Click area for opening edit drawer */}
      <button
        type="button"
        onClick={onClick}
        disabled={isNotFound}
        className={cn(
          "absolute inset-0 rounded-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isNotFound && "cursor-not-allowed"
        )}
        aria-label={`Edit ${displayName}`}
      />

      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isNotFound ? "bg-destructive/10" : "bg-primary/10"
        )}
      >
        {isNotFound ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Layers className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "truncate text-sm font-medium",
            experienceLink.enabled ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {displayName}
        </h3>
        {experience && (
          <p className="truncate text-xs text-muted-foreground">
            {experience.description || "No description"}
          </p>
        )}
        {isNotFound && (
          <p className="text-xs text-destructive">
            This experience no longer exists
          </p>
        )}
      </div>

      {/* Toggle switch - positioned above the click area */}
      <div className="relative z-10">
        <Switch
          checked={experienceLink.enabled}
          onCheckedChange={onToggle}
          disabled={isUpdating || isNotFound}
          aria-label={`${experienceLink.enabled ? "Disable" : "Enable"} ${displayName}`}
        />
      </div>
    </div>
  );
}
