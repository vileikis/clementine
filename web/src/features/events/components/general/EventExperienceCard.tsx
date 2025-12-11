"use client";

import Image from "next/image";
import { AlertTriangle, ImageIcon } from "lucide-react";
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

      {/* Preview thumbnail */}
      <div
        className={cn(
          "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg",
          isNotFound ? "bg-destructive/10" : "bg-muted"
        )}
      >
        {isNotFound ? (
          <div className="flex h-full w-full items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        ) : experience?.previewMediaUrl ? (
          <Image
            src={experience.previewMediaUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
            unoptimized={experience.previewType === "gif"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
          </div>
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
      <Switch
        checked={experienceLink.enabled}
        onCheckedChange={onToggle}
        disabled={isUpdating || isNotFound}
        aria-label={`${experienceLink.enabled ? "Disable" : "Enable"} ${displayName}`}
        className="relative"
      />
    </div>
  );
}
