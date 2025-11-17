import { getEventAction } from "@/app/actions/events";
import { notFound } from "next/navigation";
import { ContentBuilder } from "@/components/organizer/builder/ContentBuilder";

interface ContentPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Content page for event builder
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 *
 * Features:
 * - Left sidebar navigation (Welcome, Experiences, Survey, Ending)
 * - Main content area with section-specific editors
 * - Responsive layout with mobile support
 */
export default async function ContentPage({ params }: ContentPageProps) {
  const { eventId } = await params;
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <ContentBuilder event={result.event} />
    </div>
  );
}
