"use client";

import { useState, useMemo } from "react";
import { Layers, ChevronLeft, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useExperiences } from "@/features/experiences";
import type { Experience } from "@/features/experiences";

interface ExperiencePickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existingExperienceIds: string[];
  onAdd: (experienceId: string, label?: string) => Promise<void>;
}

/**
 * Drawer for selecting and adding an experience to an event.
 * Two-step flow: 1) Select experience from list, 2) Configure label and add.
 */
export function ExperiencePickerDrawer({
  open,
  onOpenChange,
  companyId,
  existingExperienceIds,
  onAdd,
}: ExperiencePickerDrawerProps) {
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { experiences, loading } = useExperiences(companyId);

  // Filter out already-attached experiences
  const availableExperiences = useMemo(
    () => experiences.filter((exp) => !existingExperienceIds.includes(exp.id)),
    [experiences, existingExperienceIds]
  );

  const handleSelectExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setLabel(""); // Reset label when selecting new experience
  };

  const handleBack = () => {
    setSelectedExperience(null);
    setLabel("");
  };

  const handleAdd = async () => {
    if (!selectedExperience) return;

    setIsSubmitting(true);
    try {
      await onAdd(selectedExperience.id, label || undefined);
      // Reset state and close drawer on success
      setSelectedExperience(null);
      setLabel("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedExperience(null);
      setLabel("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          {selectedExperience ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleBack}
                  className="-ml-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <SheetTitle>Add Experience</SheetTitle>
              </div>
              <SheetDescription>
                Configure how this experience appears in your event.
              </SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle>Select Experience</SheetTitle>
              <SheetDescription>
                Choose an experience from your library to add to this event.
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto py-4">
          {selectedExperience ? (
            // Configuration view
            <div className="space-y-6">
              {/* Selected experience preview */}
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">
                    {selectedExperience.name}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedExperience.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Label input */}
              <div className="space-y-2">
                <Label htmlFor="experience-label">Custom Label (optional)</Label>
                <Input
                  id="experience-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={selectedExperience.name}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Override the display name for this event. Leave empty to use the
                  original experience name.
                </p>
              </div>
            </div>
          ) : loading ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableExperiences.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">No experiences available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {experiences.length === 0
                  ? "Create an experience in your library first."
                  : "All experiences are already attached to this event."}
              </p>
            </div>
          ) : (
            // Experience list
            <div className="space-y-2">
              {availableExperiences.map((experience) => (
                <button
                  key={experience.id}
                  type="button"
                  onClick={() => handleSelectExperience(experience)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-4",
                    "text-left transition-colors",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{experience.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {experience.description || "No description"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with action button */}
        {selectedExperience && (
          <SheetFooter>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Experience"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
