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
import { updateGifExperience } from "../../actions/gif-update";
import { updateSurveyExperience } from "../../actions/survey-update";
import { deleteExperience } from "../../actions/shared";
import type { Experience, PhotoExperience, GifExperience, SurveyExperience } from "../../lib/schemas";

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
        const gifResult = await updateGifExperience(
          eventId,
          experienceId,
          data as Partial<GifExperience>
        );
        if (!gifResult.success) {
          throw new Error(gifResult.error.message);
        }
        break;

      case "survey":
        const surveyResult = await updateSurveyExperience(
          eventId,
          experienceId,
          data as Partial<SurveyExperience>
        );
        if (!surveyResult.success) {
          throw new Error(surveyResult.error.message);
        }
        break;

      case "video":
      case "wheel":
        throw new Error(`${experience.type} experience updates not yet implemented`);

      default:
        // Exhaustiveness check - TypeScript will error if a case is missing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
