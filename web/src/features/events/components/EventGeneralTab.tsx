"use client";

import { ExperiencesSection } from "./general";
import type { Event } from "../types/event.types";

interface EventGeneralTabProps {
  event: Event;
}

/**
 * Main General tab component for event configuration.
 * Contains experiences section (and extras section in future phases).
 */
export function EventGeneralTab({ event }: EventGeneralTabProps) {
  return (
    <div className="space-y-8">
      <ExperiencesSection event={event} />
      {/* ExtrasSection will be added in Phase 5 */}
    </div>
  );
}
