/**
 * Experience Editor Page
 * Part of Phase 5 (User Story 3) - View and Manage Experiences in Sidebar
 *
 * Provides dedicated route for editing individual experiences
 * Loads experience data from Firestore and displays editor
 *
 * Route: /events/:eventId/design/experiences/:experienceId
 */

import { notFound } from "next/navigation";
import { getExperience } from "@/lib/repositories/experiences";
import { ExperienceEditorWrapper } from "@/components/organizer/builder/ExperienceEditorWrapper";

interface ExperienceEditorPageProps {
  params: Promise<{ eventId: string; experienceId: string }>;
}

export default async function ExperienceEditorPage({
  params,
}: ExperienceEditorPageProps) {
  const { eventId, experienceId } = await params;

  // Fetch experience using Admin SDK repository
  const experience = await getExperience(eventId, experienceId);

  // Show 404 if experience doesn't exist (T024)
  if (!experience) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-8">
      <ExperienceEditorWrapper
        eventId={eventId}
        experience={experience}
      />
    </div>
  );
}
