/**
 * Experience Editor Page
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Provides dedicated route for editing individual experiences
 * Loads experience data from root /experiences collection
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

  // Fetch experience from root /experiences collection
  const experience = await getExperience(experienceId);

  // Show 404 if experience doesn't exist
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