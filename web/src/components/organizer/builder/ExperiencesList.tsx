"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experience } from "@/lib/types/firestore";

interface ExperiencesListProps {
  experiences: Experience[];
  selectedExperienceId: string | null;
  onExperienceSelect: (experienceId: string) => void;
  onAddClick: () => void;
  className?: string;
}

/**
 * ExperiencesList component for displaying and managing photo experiences.
 * Part of Phase 6 (User Story 3) - Manage Photo Experiences
 *
 * Features:
 * - Lists all experiences for an event
 * - Shows experience label and type
 * - Highlights selected experience
 * - Provides + button to add new experiences
 */
export function ExperiencesList({
  experiences,
  selectedExperienceId,
  onExperienceSelect,
  onAddClick,
  className,
}: ExperiencesListProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Section Header with Add Button */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-foreground">Experiences</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="h-8 w-8 p-0"
          aria-label="Add experience"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Experiences List */}
      {experiences.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No experiences yet. Click + to add your first experience.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {experiences.map((experience) => {
            const isSelected = selectedExperienceId === experience.id;
            return (
              <li key={experience.id}>
                <button
                  type="button"
                  onClick={() => onExperienceSelect(experience.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-md transition-colors",
                    "min-h-[44px] flex items-center gap-2",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                  aria-current={isSelected ? "page" : undefined}
                >
                  {/* Experience Icon based on type */}
                  <span className="text-base" aria-hidden="true">
                    {experience.type === "photo" && "📷"}
                    {experience.type === "video" && "🎥"}
                    {experience.type === "gif" && "🎞️"}
                    {experience.type === "wheel" && "🎡"}
                  </span>

                  {/* Experience Label */}
                  <span className="text-sm flex-1 truncate">
                    {experience.label}
                  </span>

                  {/* Enabled/Disabled Indicator */}
                  {!experience.enabled && (
                    <span className="text-xs text-muted-foreground">(Disabled)</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
