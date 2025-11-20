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
import { updatePhotoExperience } from "../../actions/photo-update";
import { deleteExperience } from "../../actions/shared";
import type { PhotoExperience } from "../../lib/schemas";

interface ExperienceEditorWrapperProps {
  eventId: string;
  experience: PhotoExperience;
}

export function ExperienceEditorWrapper({
  eventId,
  experience,
}: ExperienceEditorWrapperProps) {
  const router = useRouter();

  const handleSave = async (
    experienceId: string,
    data: Partial<PhotoExperience>
  ) => {
    const result = await updatePhotoExperience(eventId, experienceId, data);

    if (!result.success) {
      throw new Error(result.error.message);
    }
  };

  const handleDelete = async (experienceId: string) => {
    const result = await deleteExperience(eventId, experienceId);

    if (!result.success) {
      throw new Error(result.error.message);
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
