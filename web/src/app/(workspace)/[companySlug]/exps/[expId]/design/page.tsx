import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getExperienceAction } from "@/features/experiences/actions";
import { notFound } from "next/navigation";
import { ExperienceEditorClient } from "../ExperienceEditorClient";

interface DesignPageProps {
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Design tab page for experience editor.
 * Renders the step editor for configuring experience flow.
 */
export default async function DesignPage({ params }: DesignPageProps) {
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
    <ExperienceEditorClient
      companySlug={companySlug}
      companyId={company.id}
      initialExperience={experience}
    />
  );
}
