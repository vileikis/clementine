import { getEventAction } from "@/app/actions/events";
import { notFound } from "next/navigation";
import { EndingEditor } from "@/components/organizer/builder/EndingEditor";

interface EndingPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Ending editor page - configures event ending screen and share options
 * Part of Phase 3 (User Story 1) - Navigate Between Event Design Sections
 *
 * Features:
 * - URL-based routing (/design/ending)
 * - Persistent sidebar via layout
 * - Browser back/forward support
 */
export default async function EndingPage({ params }: EndingPageProps) {
  const { eventId } = await params;
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return <EndingEditor event={result.event} />;
}
