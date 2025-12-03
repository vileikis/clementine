import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getExperienceAction } from "@/features/experiences/actions";
import { notFound } from "next/navigation";
import { ExperienceSettingsClient } from "./ExperienceSettingsClient";

interface SettingsPageProps {
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Settings tab page for experience editor.
 * Renders the settings form for editing experience metadata.
 */
export default async function SettingsPage({ params }: SettingsPageProps) {
  const { companySlug, expId } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  const experienceResult = await getExperienceAction(expId);
  if (!experienceResult.success || !experienceResult.data) {
    notFound();
  }

  const experience = experienceResult.data;

  // Verify the experience belongs to this company
  if (experience.companyId !== company.id) {
    notFound();
  }

  return (
    <ExperienceSettingsClient
      companySlug={companySlug}
      companyId={company.id}
      initialExperience={experience}
    />
  );
}
