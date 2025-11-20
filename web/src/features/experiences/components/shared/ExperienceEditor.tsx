"use client";

import { PhotoExperienceEditor } from "../photo/PhotoExperienceEditor";
import type { Experience, PhotoExperience } from "../../lib/schemas";

interface ExperienceEditorProps {
  experience: Experience;
  onSave: (experienceId: string, data: Partial<Experience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * ExperienceEditor - Wrapper component with discriminated union routing
 * Created in Phase 2 (User Story 1) - Edit Shared Experience Fields
 *
 * Routes to type-specific editor components based on experience.type:
 * - photo → PhotoExperienceEditor
 * - gif → GifExperienceEditor (Phase 3)
 * - video → VideoExperienceEditor (future)
 * - wheel → WheelExperienceEditor (future)
 * - survey → SurveyExperienceEditor (future)
 *
 * TypeScript automatically narrows the experience type within each case,
 * allowing type-specific components to receive fully-typed props.
 *
 * Pattern: Switch-case with exhaustiveness checking (research.md)
 */
export function ExperienceEditor({
  experience,
  onSave,
  onDelete,
  className,
}: ExperienceEditorProps) {
  // Switch-case routing based on discriminant field
  switch (experience.type) {
    case "photo":
      return (
        <PhotoExperienceEditor
          experience={experience} // Type narrowed to PhotoExperience
          onSave={onSave as (id: string, data: Partial<PhotoExperience>) => Promise<void>}
          onDelete={onDelete}
          className={className}
        />
      );

    case "gif":
      // Placeholder for GifExperienceEditor (Phase 3)
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">GIF Experience Editor</h2>
          <p className="text-sm text-muted-foreground">
            GIF experience editing will be implemented in Phase 3.
          </p>
        </div>
      );

    case "video":
      // Placeholder for VideoExperienceEditor (future)
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Video Experience Editor</h2>
          <p className="text-sm text-muted-foreground">
            Video experience editing is not yet implemented.
          </p>
        </div>
      );

    case "wheel":
      // Placeholder for WheelExperienceEditor (future)
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Wheel Experience Editor</h2>
          <p className="text-sm text-muted-foreground">
            Wheel experience editing is not yet implemented.
          </p>
        </div>
      );

    case "survey":
      // Placeholder for SurveyExperienceEditor (future)
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Survey Experience Editor</h2>
          <p className="text-sm text-muted-foreground">
            Survey experience editing is not yet implemented.
          </p>
        </div>
      );

    default:
      // Exhaustiveness check - TypeScript will error if a case is missing
      const _exhaustive: never = experience;
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Unknown Experience Type</h2>
          <p className="text-sm text-muted-foreground">
            This experience type is not supported.
          </p>
        </div>
      );
  }
}
