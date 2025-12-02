import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { ExperienceList } from "@/features/experiences/components";

interface ExperiencesPageProps {
  params: Promise<{ companySlug: string }>;
}

/**
 * Company experiences list page
 * Breadcrumbs: Experiences
 */
export default async function ExperiencesPage({ params }: ExperiencesPageProps) {
  const { companySlug } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // For the list page, we just show "Experiences" as the current page
  const breadcrumbs = buildBreadcrumbs(company, { current: "Experiences" });

  return (
    <div className="flex flex-col h-full">
      <ContentHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto p-6">
        <ExperienceList companyId={company.id} companySlug={company.slug} />
      </div>
    </div>
  );
}
