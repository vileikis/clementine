"use client";

import { PhotoExperienceEditor } from "../photo/PhotoExperienceEditor";
import { GifExperienceEditor } from "../gif/GifExperienceEditor";
import type { Experience, PhotoExperience, GifExperience } from "../../schemas";

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
      return (
        <GifExperienceEditor
          experience={experience} // Type narrowed to GifExperience
          onSave={onSave as (id: string, data: Partial<GifExperience>) => Promise<void>}
          onDelete={onDelete}
          className={className}
        />
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

    default:
      // Exhaustiveness check - TypeScript will error if a case is missing
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
