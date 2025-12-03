"use client";

import { Button } from "@/components/ui/button";
import { Plus, Route } from "lucide-react";
import type { Journey } from "../types";
import type { Project as Event } from "@/features/projects/types/project.types";
import { JourneyCard } from "./JourneyCard";
import { CreateJourneyDialog } from "./CreateJourneyDialog";
import { useState } from "react";

interface JourneyListProps {
  journeys: Journey[];
  event: Event;
}

/**
 * JourneyList - Displays list of journeys with empty state handling
 * Mobile-first responsive design
 */
export function JourneyList({ journeys, event }: JourneyListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isEmpty = journeys.length === 0;

  return (
    <div className="space-y-4">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Journeys</h2>
        {!isEmpty && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Journey
          </Button>
        )}
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Route className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No journeys yet
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4 max-w-sm">
            Create your first journey to define the guest experience flow for
            this event.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Journey
          </Button>
        </div>
      ) : (
        /* Journey List */
        <div className="space-y-3">
          {journeys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              eventId={event.id}
              isActive={event.activeEventId === journey.id}
            />
          ))}
        </div>
      )}

      <CreateJourneyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        eventId={event.id}
      />
    </div>
  );
}
