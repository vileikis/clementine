"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateEventSwitchboardAction } from "@/features/events/actions/events";
import type { Journey } from "../types";
import { DeleteJourneyDialog } from "./DeleteJourneyDialog";
import { deleteJourneyAction } from "../actions/journeys";

interface JourneyCardProps {
  journey: Journey;
  eventId: string;
  isActive: boolean;
}

/**
 * JourneyCard - Displays a single journey with toggle and delete controls
 * Mobile-first design with touch targets >= 44x44px
 */
export function JourneyCard({ journey, eventId, isActive }: JourneyCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [optimisticActive, setOptimisticActive] = useState(isActive);

  // Sync local state when prop changes (after router.refresh())
  useEffect(() => {
    setOptimisticActive(isActive);
  }, [isActive]);

  // Format date for display
  const createdDate = new Date(journey.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stepCount = journey.stepOrder.length;

  const handleToggleActive = (checked: boolean) => {
    // Optimistic update
    setOptimisticActive(checked);

    startTransition(async () => {
      const result = await updateEventSwitchboardAction(
        eventId,
        checked ? journey.id : null
      );

      if (result.success) {
        toast.success(checked ? "Journey activated" : "Journey deactivated");
        // Refresh to sync all cards with updated event.activeJourneyId
        router.refresh();
      } else {
        // Revert optimistic update
        setOptimisticActive(!checked);
        toast.error(result.error.message);
      }
    });
  };

  const handleDelete = async () => {
    const result = await deleteJourneyAction(eventId, journey.id);
    if (!result.success) {
      throw new Error(result.error.message);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on switch or delete button
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="switch"]') ||
      target.closest('[data-state]')
    ) {
      return;
    }
    router.push(`/events/${eventId}/design/journeys/${journey.id}`);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors min-h-[72px]"
      >
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="font-medium text-base text-gray-900 truncate">
            {journey.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {stepCount} {stepCount === 1 ? "step" : "steps"} &middot; Created{" "}
            {createdDate}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {optimisticActive ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={optimisticActive}
              onCheckedChange={handleToggleActive}
              disabled={isPending}
              className="min-w-[44px] min-h-[24px]"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="min-w-[44px] min-h-[44px] text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete journey</span>
          </Button>
        </div>
      </div>

      <DeleteJourneyDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        journeyName={journey.name}
        onDelete={handleDelete}
      />
    </>
  );
}
