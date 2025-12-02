import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { notFound } from "next/navigation";

interface ExperiencePageProps {
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Experience editor page
 * Breadcrumbs: Experiences > [Experience Name]
 */
export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { companySlug, expId } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch experience when entity exists
  const experienceName = `Experience ${expId}`;

  const breadcrumbs = buildBreadcrumbs(company, {
    experience: { name: experienceName, id: expId },
  });

  return (
    <div className="flex flex-col h-full">
      <ContentHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              Coming Soon
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Experience editor is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
