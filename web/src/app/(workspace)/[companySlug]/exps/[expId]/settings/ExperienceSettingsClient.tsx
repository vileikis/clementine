"use client";

import { useEffect } from "react";
import { ExperienceSettingsForm } from "@/features/experiences/components/settings";
import { useExperience } from "@/features/experiences/hooks";
import type { Experience } from "@/features/experiences/types";

interface ExperienceSettingsClientProps {
  companyId: string;
  initialExperience: Experience;
}

/**
 * Client-side wrapper for the experience settings page.
 * Subscribes to real-time experience updates.
 */
export function ExperienceSettingsClient({
  companyId,
  initialExperience,
}: ExperienceSettingsClientProps) {
  // Subscribe to real-time experience updates
  const { experience: liveExperience, loading, error } = useExperience(
    initialExperience.id
  );

  // Log sync errors for debugging (UI still works via initialExperience fallback)
  useEffect(() => {
    if (error) {
      console.warn("Real-time sync unavailable, using server data:", error.message);
    }
  }, [error]);

  // Use live experience if available, otherwise fall back to initial
  const experience = liveExperience ?? initialExperience;

  if (loading && !liveExperience) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your experience&apos;s name, description, and preview image.
        </p>
      </div>

      <ExperienceSettingsForm experience={experience} companyId={companyId} />
    </div>
  );
}
