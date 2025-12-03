"use client";

import { Layers } from "lucide-react";

/**
 * Event Experiences Tab placeholder component.
 *
 * Displays a placeholder message indicating that experience linking
 * will be available in a future phase.
 */
export function EventExperiencesTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Coming Soon
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Experience linking will allow you to connect this event to one or more
          reusable experiences from your Experience Library. Stay tuned!
        </p>
      </div>
    </div>
  );
}
