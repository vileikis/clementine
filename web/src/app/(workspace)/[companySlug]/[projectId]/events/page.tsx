import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { notFound } from "next/navigation";

interface EventsPageProps {
  params: Promise<{ companySlug: string; projectId: string }>;
}

/**
 * Project events page
 * Breadcrumbs: Projects > [Project Name] > Events
 */
export default async function EventsPage({ params }: EventsPageProps) {
  const { companySlug, projectId } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project when Projects entity exists
  const projectName = `Project ${projectId}`;

  const breadcrumbs = buildBreadcrumbs(company, {
    project: { name: projectName, id: projectId },
    current: "Events",
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
              Events feature is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
