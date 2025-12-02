"use client";

/**
 * Component: EmptyExperiences
 *
 * Empty state shown when a company has no experiences.
 * Includes a prompt to create the first experience.
 */

import { Sparkles } from "lucide-react";
import { CreateExperienceButton } from "./CreateExperienceButton";

interface EmptyExperiencesProps {
  companyId: string;
  companySlug: string;
}

export function EmptyExperiences({
  companyId,
  companySlug,
}: EmptyExperiencesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No experiences yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Create your first experience to start building interactive journeys for
        your guests.
      </p>
      <CreateExperienceButton
        companyId={companyId}
        companySlug={companySlug}
        size="lg"
      />
    </div>
  );
}
