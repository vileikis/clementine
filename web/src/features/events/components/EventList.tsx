"use client";

/**
 * Component: EventList
 *
 * Displays a grid of events for a project.
 * Shows empty state if no events exist.
 * Includes header with create button.
 */

import { Loader2, CalendarDays } from "lucide-react";
import { EventCard } from "./EventCard";
import { CreateEventDialog } from "./CreateEventDialog";
import { useEvents } from "../hooks/useEvents";
import { useProject } from "@/features/projects/hooks/useProject";

interface EventListProps {
  projectId: string;
}

export function EventList({ projectId }: EventListProps) {
  const { events, loading, error } = useEvents(projectId);
  const { project } = useProject(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-destructive mb-2">Failed to load events</p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return <EmptyEvents projectId={projectId} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {events.length} {events.length === 1 ? "event" : "events"}
          </p>
        </div>
        <CreateEventDialog projectId={projectId} />
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isActive={project?.activeEventId === event.id}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state shown when a project has no events.
 */
function EmptyEvents({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <CalendarDays className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No events yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Create your first event to start organizing themed experiences for your
        guests.
      </p>
      <CreateEventDialog projectId={projectId} size="lg" />
    </div>
  );
}
