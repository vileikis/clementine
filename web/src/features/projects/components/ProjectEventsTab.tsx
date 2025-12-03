"use client";

import { CalendarDays } from "lucide-react";

/**
 * Project Events Tab placeholder component.
 *
 * Displays a placeholder message indicating that nested events
 * will be available in Phase 5 of the scalable architecture roadmap.
 */
export function ProjectEventsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Coming in Phase 5
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Nested events will allow you to organize multiple themed experiences
          within a single project. Stay tuned!
        </p>
      </div>
    </div>
  );
}
