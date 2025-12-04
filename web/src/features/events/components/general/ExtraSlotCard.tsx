"use client";

import Image from "next/image";
import { Plus, ImageIcon, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { EventExperienceLink } from "../../types/event.types";
import type { Experience } from "@/features/experiences";
import { EXTRA_SLOTS, EXTRA_FREQUENCIES } from "../../constants";

type ExtraSlotKey = keyof typeof EXTRA_SLOTS;

interface ExtraSlotCardProps {
  slotKey: ExtraSlotKey;
  experienceLink: EventExperienceLink | null | undefined;
  experience: Experience | null;
  onClick: () => void;
  onToggle?: (enabled: boolean) => void;
  isUpdating?: boolean;
}

/**
 * Card component for an extra slot (pre-entry gate or pre-reward).
 * Shows empty state with "+" or configured experience with toggle.
 */
export function ExtraSlotCard({
  slotKey,
  experienceLink,
  experience,
  onClick,
  onToggle,
  isUpdating,
}: ExtraSlotCardProps) {
  const slotConfig = EXTRA_SLOTS[slotKey];
  const isEmpty = !experienceLink;
  const isNotFound = Boolean(experienceLink && !experience);

  // Get display name
  const displayName = experienceLink?.label || experience?.name || "Experience not found";

  // Get frequency label
  const frequencyLabel = experienceLink?.frequency
    ? EXTRA_FREQUENCIES[experienceLink.frequency]?.label
    : null;

  if (isEmpty) {
    // Empty slot - show add button
    return (
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-medium">{slotConfig.label}</h3>
          <p className="text-xs text-muted-foreground">{slotConfig.description}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6",
            "text-muted-foreground transition-colors",
            "hover:border-primary/50 hover:bg-accent/50 hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "min-h-[88px]" // Touch-friendly height
          )}
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Add {slotConfig.label}</span>
        </button>
      </div>
    );
  }

  // Configured slot - show experience card with toggle
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium">{slotConfig.label}</h3>
        <p className="text-xs text-muted-foreground">{slotConfig.description}</p>
      </div>
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
          <h4
            className={cn(
              "truncate text-sm font-medium",
              experienceLink.enabled ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {displayName}
          </h4>
          {frequencyLabel && !isNotFound && (
            <p className="truncate text-xs text-muted-foreground">
              {frequencyLabel}
            </p>
          )}
          {isNotFound && (
            <p className="text-xs text-destructive">
              This experience no longer exists
            </p>
          )}
        </div>

        {/* Toggle switch - positioned above the click area */}
        {onToggle && (
          <div className="relative z-10">
            <Switch
              checked={experienceLink.enabled}
              onCheckedChange={onToggle}
              disabled={isUpdating || isNotFound}
              aria-label={`${experienceLink.enabled ? "Disable" : "Enable"} ${displayName}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
