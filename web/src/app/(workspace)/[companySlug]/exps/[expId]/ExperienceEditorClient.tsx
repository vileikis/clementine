"use client";

/**
 * Experience Editor Client
 *
 * Client-side wrapper that:
 * - Subscribes to real-time experience updates
 * - Manages rename dialog state
 * - Renders the ExperienceEditor component
 */

import { useState, useEffect } from "react";
import { ExperienceEditor } from "@/features/experiences/components/editor";
import { RenameExperienceDialog } from "@/features/experiences/components/RenameExperienceDialog";
import { useExperience } from "@/features/experiences/hooks";
import type { Experience } from "@/features/experiences/types";

interface ExperienceEditorClientProps {
  companySlug: string;
  companyId: string;
  initialExperience: Experience;
}

export function ExperienceEditorClient({
  companySlug,
  companyId,
  initialExperience,
}: ExperienceEditorClientProps) {
  // Subscribe to real-time experience updates
  const { experience: liveExperience, loading, error } = useExperience(initialExperience.id);

  // Log sync errors for debugging (UI still works via initialExperience fallback)
  useEffect(() => {
    if (error) {
      console.warn("Real-time sync unavailable, using server data:", error.message);
    }
  }, [error]);

  // Use live experience if available, otherwise fall back to initial
  const experience = liveExperience ?? initialExperience;

  // Rename dialog state
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const handleRenameClick = () => {
    setIsRenameOpen(true);
  };

  if (loading && !liveExperience) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading experience...</p>
      </div>
    );
  }

  return (
    <>
      <ExperienceEditor
        companySlug={companySlug}
        companyId={companyId}
        experience={experience}
        onRenameClick={handleRenameClick}
      />

      <RenameExperienceDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        experience={experience}
      />
    </>
  );
}
