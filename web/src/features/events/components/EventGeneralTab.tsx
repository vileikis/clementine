"use client";

import { ExperiencesSection, ExtrasSection } from "./general";
import type { Event } from "../types/event.types";

interface EventGeneralTabProps {
  event: Event;
}

/**
 * Main General tab component for event configuration.
 * Contains experiences section and extras section.
 */
export function EventGeneralTab({ event }: EventGeneralTabProps) {
  return (
    <div className="space-y-8">
      <ExperiencesSection event={event} />
      <ExtrasSection event={event} />
    </div>
  );
}
