import { getEventAction } from "@/app/actions/events";
import { notFound } from "next/navigation";

interface ContentPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Content page for event builder
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 * Placeholder - full implementation will come in Phase 4 (User Story 1)
 */
export default async function ContentPage({ params }: ContentPageProps) {
  const { eventId } = await params;
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Event Content Builder</h1>
        <p className="text-muted-foreground">
          Configure welcome screen, experiences, survey, and ending
        </p>
      </div>

      {/* Placeholder for builder UI */}
      <div className="border rounded-lg p-12 bg-muted/50">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <span className="text-2xl">🎨</span>
          </div>
          <h3 className="text-lg font-medium">Content Builder Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The full content builder with sidebar navigation (Welcome, Experiences,
            Survey, Ending) will be implemented in Phase 4 (User Story 1).
          </p>
        </div>
      </div>
    </div>
  );
}
