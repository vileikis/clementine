"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { ExperiencesSection, ExtrasSection } from "./general";
import { WelcomeSection, WelcomePreview } from "./welcome";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useExperienceDetails } from "@/features/experiences";
import { updateEventWelcomeAction } from "../actions";
import { eventWelcomeSchema } from "../schemas";
import type { Event, EventWelcome } from "../types/event.types";
import { DEFAULT_EVENT_WELCOME } from "../types/event.types";

interface EventGeneralTabProps {
  event: Event;
}

/**
 * Main General tab component for event configuration.
 * Contains welcome section, experiences section, and extras section.
 *
 * Two-column layout on large screens:
 * - Left: Form sections (Welcome, Experiences, Extras)
 * - Right: Sticky live preview
 *
 * Form state is lifted to this level to enable:
 * - Real-time preview updates via form.watch()
 * - Autosave integration with useAutoSave hook
 */
export function EventGeneralTab({ event }: EventGeneralTabProps) {
  // Initialize form with welcome data
  const form = useForm<EventWelcome>({
    resolver: standardSchemaResolver(eventWelcomeSchema),
    defaultValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
  });

  // Watch form values for real-time preview updates
  const watchedValues = useWatch({ control: form.control });
  const welcomeValues: EventWelcome = {
    ...DEFAULT_EVENT_WELCOME,
    ...watchedValues,
  };

  // Fetch experience details once for all child components
  const experienceIds = useMemo(
    () => event.experiences.map((exp) => exp.experienceId),
    [event.experiences]
  );
  const { experiencesMap, loading: loadingExperiences } =
    useExperienceDetails(experienceIds);

  // Handle save - called by useAutoSave
  const handleSave = async (updates: Partial<EventWelcome>) => {
    const result = await updateEventWelcomeAction(
      event.projectId,
      event.id,
      updates
    );

    if (result.success) {
      toast.success("Saved");
    } else {
      toast.error(result.error.message);
    }
  };

  // Autosave on blur with 500ms debounce
  const { handleBlur } = useAutoSave({
    form,
    originalValues: event.welcome ?? DEFAULT_EVENT_WELCOME,
    onUpdate: handleSave,
    fieldsToCompare: ["title", "description", "mediaUrl", "mediaType", "layout"],
    debounceMs: 500,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] items-start">
      {/* Left column: Form sections */}
      <div className="space-y-8">
        <WelcomeSection form={form} event={event} onBlur={handleBlur} />
        <ExperiencesSection
          event={event}
          experiencesMap={experiencesMap}
          loadingExperiences={loadingExperiences}
        />
        <ExtrasSection event={event} />
      </div>

      {/* Right column: Sticky preview */}
      <div className="hidden lg:block lg:sticky lg:top-4">
        <WelcomePreview
          welcome={welcomeValues}
          event={event}
          experiencesMap={experiencesMap}
        />
      </div>
    </div>
  );
}
