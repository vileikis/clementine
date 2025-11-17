/**
 * Experience Creation Page
 * Part of Phase 4 (User Story 2) - Create New Experience Inline
 *
 * Provides inline form for creating new experiences at dedicated route
 * Replaces modal-based creation with URL-based navigation pattern
 *
 * Route: /events/:eventId/design/experiences/create
 */

import { CreateExperienceForm } from "@/components/organizer/builder/CreateExperienceForm";

interface CreateExperiencePageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CreateExperiencePage({
  params,
}: CreateExperiencePageProps) {
  const { eventId } = await params;

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
      <CreateExperienceForm eventId={eventId} />
    </div>
  );
}
