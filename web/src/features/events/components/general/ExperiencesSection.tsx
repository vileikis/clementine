"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { AddExperienceCard } from "./AddExperienceCard";
import { EventExperienceCard } from "./EventExperienceCard";
import { ExperiencePickerDrawer } from "./ExperiencePickerDrawer";
import { EventExperienceDrawer } from "./EventExperienceDrawer";
import { useExperienceDetails } from "@/features/experiences";
import {
  addEventExperienceAction,
  updateEventExperienceAction,
} from "../../actions";
import type { Event, EventExperienceLink } from "../../types/event.types";

interface ExperiencesSectionProps {
  event: Event;
}

/**
 * Section component displaying the experiences grid.
 * Contains add card + attached experience cards with toggles.
 */
export function ExperiencesSection({ event }: ExperiencesSectionProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<EventExperienceLink | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get experience IDs from the event
  const experienceIds = useMemo(
    () => event.experiences.map((exp) => exp.experienceId),
    [event.experiences]
  );

  // Fetch experience details for display
  const { experiencesMap, loading: loadingDetails } =
    useExperienceDetails(experienceIds);

  const handleAddExperience = async (
    experienceId: string,
    label?: string
  ): Promise<void> => {
    const result = await addEventExperienceAction({
      projectId: event.projectId,
      eventId: event.id,
      experienceId,
      label: label ?? null,
    });

    if (result.success) {
      toast.success("Experience added");
    } else {
      toast.error(result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleToggleExperience = (experienceId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await updateEventExperienceAction({
        projectId: event.projectId,
        eventId: event.id,
        experienceId,
        enabled,
      });

      if (result.success) {
        toast.success(enabled ? "Experience enabled" : "Experience disabled");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleClickExperience = (experienceLink: EventExperienceLink) => {
    setEditingExperience(experienceLink);
  };

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold">Experiences</h2>
        <p className="text-sm text-muted-foreground">
          Add experiences from your library that guests can choose from.
        </p>
      </div>

      {/* Experience grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Existing experiences */}
        {event.experiences.map((experienceLink) => (
          <EventExperienceCard
            key={experienceLink.experienceId}
            experienceLink={experienceLink}
            experience={experiencesMap.get(experienceLink.experienceId) ?? null}
            onToggle={(enabled) =>
              handleToggleExperience(experienceLink.experienceId, enabled)
            }
            onClick={() => handleClickExperience(experienceLink)}
            isUpdating={isPending}
          />
        ))}

        {/* Add experience card */}
        <AddExperienceCard
          onClick={() => setIsPickerOpen(true)}
          disabled={isPending || loadingDetails}
        />
      </div>

      {/* Experience picker drawer */}
      <ExperiencePickerDrawer
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        companyId={event.companyId}
        existingExperienceIds={experienceIds}
        onAdd={handleAddExperience}
      />

      {/* Experience edit drawer - key forces remount when different experience selected */}
      <EventExperienceDrawer
        key={editingExperience?.experienceId ?? "none"}
        open={editingExperience !== null}
        onOpenChange={(open) => {
          if (!open) setEditingExperience(null);
        }}
        projectId={event.projectId}
        eventId={event.id}
        experienceLink={editingExperience}
        experience={
          editingExperience
            ? experiencesMap.get(editingExperience.experienceId) ?? null
            : null
        }
      />
    </section>
  );
}
