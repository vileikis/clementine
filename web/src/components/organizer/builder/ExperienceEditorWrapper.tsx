"use client";

/**
 * ExperienceEditorWrapper component
 * Part of Phase 5 (User Story 3) - View and Manage Experiences in Sidebar
 *
 * Wraps ExperienceEditor with Server Actions for update and delete
 * Handles navigation after deletion
 */

import { useRouter } from "next/navigation";
import { ExperienceEditor } from "./ExperienceEditor";
import {
  updateExperienceAction,
  deleteExperienceAction,
} from "@/app/actions/experiences";
import type { Experience } from "@/lib/types/firestore";

interface ExperienceEditorWrapperProps {
  eventId: string;
  experience: Experience;
}

export function ExperienceEditorWrapper({
  eventId,
  experience,
}: ExperienceEditorWrapperProps) {
  const router = useRouter();

  const handleSave = async (
    experienceId: string,
    data: Partial<Experience>
  ) => {
    const result = await updateExperienceAction(eventId, experienceId, data);

    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const handleDelete = async (experienceId: string) => {
    const result = await deleteExperienceAction(eventId, experienceId);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Redirect to welcome screen after deletion
    router.push(`/events/${eventId}/design/welcome`);
  };

  return (
    <ExperienceEditor
      experience={experience}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
