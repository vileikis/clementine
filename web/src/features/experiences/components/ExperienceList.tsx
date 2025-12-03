"use client";

/**
 * Component: ExperienceList
 *
 * Displays a grid of experiences for a company.
 * Shows empty state if no experiences exist.
 * Includes header with create button.
 */

import { Loader2 } from "lucide-react";
import { ExperienceCard } from "./ExperienceCard";
import { EmptyExperiences } from "./EmptyExperiences";
import { CreateExperienceButton } from "./CreateExperienceButton";
import { useExperiences } from "../hooks";

interface ExperienceListProps {
  companyId: string;
  companySlug: string;
}

export function ExperienceList({ companyId, companySlug }: ExperienceListProps) {
  const { experiences, loading, error } = useExperiences(companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-destructive mb-2">
          Failed to load experiences
        </p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (experiences.length === 0) {
    return <EmptyExperiences companyId={companyId} companySlug={companySlug} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-semibold">Experiences</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {experiences.length}{" "}
            {experiences.length === 1 ? "experience" : "experiences"}
          </p>
        </div>
        <CreateExperienceButton
          companyId={companyId}
          companySlug={companySlug}
        />
      </div>

      {/* Experience grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {experiences.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            companySlug={companySlug}
          />
        ))}
      </div>
    </div>
  );
}
