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
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ExperienceEditorWrapper } from "@/components/organizer/builder/ExperienceEditorWrapper";
import type { Experience } from "@/lib/types/firestore";

interface ExperienceEditorPageProps {
  params: Promise<{ eventId: string; experienceId: string }>;
}

export default async function ExperienceEditorPage({
  params,
}: ExperienceEditorPageProps) {
  const { eventId, experienceId } = await params;

  // Fetch experience from Firestore
  const experienceRef = doc(
    db,
    "events",
    eventId,
    "experiences",
    experienceId
  );
  const experienceSnap = await getDoc(experienceRef);

  // Show 404 if experience doesn't exist (T024)
  if (!experienceSnap.exists()) {
    notFound();
  }

  const experience: Experience = {
    id: experienceSnap.id,
    ...experienceSnap.data(),
  } as Experience;

  return (
    <div className="container max-w-4xl py-8">
      <ExperienceEditorWrapper
        eventId={eventId}
        experience={experience}
      />
    </div>
  );
}
