"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExperienceSettingsForm } from "@/features/experiences/components/settings";
import { ExperienceTabs } from "@/features/experiences/components/editor/ExperienceTabs";
import { useExperience } from "@/features/experiences/hooks";
import type { Experience } from "@/features/experiences/types";

interface ExperienceSettingsClientProps {
  companySlug: string;
  companyId: string;
  initialExperience: Experience;
}

/**
 * Client-side wrapper for the experience settings page.
 * Includes header with tabs and subscribes to real-time experience updates.
 */
export function ExperienceSettingsClient({
  companySlug,
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
    <div className="flex flex-col h-full">
      {/* Header - matches ExperienceEditorHeader structure */}
      <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
        {/* Back Button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
          <Link href={`/${companySlug}/exps`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to experiences</span>
          </Link>
        </Button>

        {/* Experience Name */}
        <div className="min-w-20">
          <h1 className="text-base font-semibold truncate">{experience.name}</h1>
          <p className="text-xs text-muted-foreground">
            {experience.stepsOrder.length} step{experience.stepsOrder.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Tabs - centered */}
        <div className="flex flex-1 justify-center">
          <ExperienceTabs companySlug={companySlug} experienceId={experience.id} />
        </div>

        {/* Spacer to balance the layout (no play button on settings) */}
        <div className="w-[88px] shrink-0 hidden sm:block" />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your experience&apos;s name, description, and preview image.
            </p>
          </div>

          <ExperienceSettingsForm experience={experience} companyId={companyId} />
        </div>
      </main>
    </div>
  );
}
