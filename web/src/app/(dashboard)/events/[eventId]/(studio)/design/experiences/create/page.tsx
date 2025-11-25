/**
 * Experience Creation Page
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Provides inline form for creating new experiences at dedicated route
 * Replaces modal-based creation with URL-based navigation pattern
 *
 * Route: /events/:eventId/design/experiences/create
 */

import { notFound } from "next/navigation";
import { CreateExperienceForm } from "@/features/experiences";
import { getEventAction } from "@/features/events/actions";

interface CreateExperiencePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CreateExperiencePage({
  params,
}: CreateExperiencePageProps) {
  const { eventId } = await params;

  // Fetch event to get companyId (ownerId)
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  const companyId = result.event.ownerId;

  // If event has no company association, we can't create experiences
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Experience
          </h1>
          <p className="text-destructive">
            This event is not associated with a company. Please assign the event to a company first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Experience
        </h1>
        <p className="text-muted-foreground">
          Choose a type and give your experience a name to get started.
        </p>
      </div>

      {/* Creation Form */}
      <CreateExperienceForm eventId={eventId} companyId={companyId} />
    </div>
  );
}