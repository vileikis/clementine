"use client";

import { EventList } from "@/features/events/components/EventList";

interface ProjectEventsTabProps {
  projectId: string;
}

/**
 * Project Events Tab component.
 *
 * Displays the list of events for a project.
 * Wraps the EventList component from the events feature module.
 */
export function ProjectEventsTab({ projectId }: ProjectEventsTabProps) {
  return (
    <div className="p-6">
      <EventList projectId={projectId} />
    </div>
  );
}
