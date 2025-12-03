import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ProjectList } from "@/features/projects/components";

interface ProjectsPageProps {
  params: Promise<{ companySlug: string }>;
}

/**
 * Company projects list page (server component)
 */
export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { companySlug } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 pt-8">
        <ProjectList companyId={company.id} companySlug={company.slug} />
      </div>
    </div>
  );
}
