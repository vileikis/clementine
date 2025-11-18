import { getEventAction, WelcomeEditor } from "@/features/events";
import { notFound } from "next/navigation";

interface WelcomePageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Welcome editor page - configures event welcome screen
 * Part of Phase 3 (User Story 1) - Navigate Between Event Design Sections
 *
 * Features:
 * - URL-based routing (/design/welcome)
 * - Persistent sidebar via layout
 * - Browser back/forward support
 */
export default async function WelcomePage({ params }: WelcomePageProps) {
  const { eventId } = await params;
  const result = await getEventAction(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return <WelcomeEditor event={result.event} />;
}
