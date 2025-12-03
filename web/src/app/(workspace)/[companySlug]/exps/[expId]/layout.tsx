import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getExperienceAction } from "@/features/experiences/actions";
import { notFound } from "next/navigation";
import { ExperienceTabs } from "@/features/experiences/components/editor/ExperienceTabs";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ExperienceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Shared layout for experience editor routes.
 * Provides header with back link, experience name, and tab navigation.
 */
export default async function ExperienceLayout({
  children,
  params,
}: ExperienceLayoutProps) {
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Back link and title */}
          <div className="flex items-center gap-3">
            <Link
              href={`/${companySlug}/exps`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Experiences</span>
            </Link>
            <h1 className="text-lg font-semibold truncate">{experience.name}</h1>
          </div>

          {/* Tab navigation */}
          <ExperienceTabs companySlug={companySlug} experienceId={expId} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
