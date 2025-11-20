"use client";

/**
 * ExperienceEditorWrapper component
 * Updated in Phase 2 (User Story 1) to support all experience types
 *
 * Wraps ExperienceEditor with Server Actions for update and delete
 * Routes to correct Server Action based on experience type
 * Handles navigation after deletion
 */

import { useRouter } from "next/navigation";
import { ExperienceEditor } from "./ExperienceEditor";
import { updatePhotoExperience } from "../../actions/photo-update";
import { deleteExperience } from "../../actions/shared";
import type { Experience, PhotoExperience } from "../../lib/schemas";

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
    // Route to correct Server Action based on experience type
    switch (experience.type) {
      case "photo":
        const photoResult = await updatePhotoExperience(
          eventId,
          experienceId,
          data as Partial<PhotoExperience>
        );
        if (!photoResult.success) {
          throw new Error(photoResult.error.message);
        }
        break;

      case "gif":
        // TODO: Implement in Phase 3
        // const gifResult = await updateGifExperience(eventId, experienceId, data as Partial<GifExperience>);
        throw new Error("GIF experience updates not yet implemented");

      case "video":
      case "wheel":
      case "survey":
        throw new Error(`${experience.type} experience updates not yet implemented`);

      default:
        const _exhaustive: never = experience;
        throw new Error("Unknown experience type");
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
