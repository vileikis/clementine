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
import { getExperience } from "@/features/experiences/repositories";
import { ExperienceEditorWrapper } from "@/features/experiences";

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
    <ExperienceEditorWrapper
      eventId={eventId}
      experience={experience}
    />
  );
}