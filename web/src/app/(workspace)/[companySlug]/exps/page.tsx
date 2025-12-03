import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ExperienceList } from "@/features/experiences/components";

interface ExperiencesPageProps {
  params: Promise<{ companySlug: string }>;
}

/**
 * Company experiences list page
 */
export default async function ExperiencesPage({ params }: ExperiencesPageProps) {
  const { companySlug } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 pt-8">
        <ExperienceList companyId={company.id} companySlug={company.slug} />
      </div>
    </div>
  );
}
