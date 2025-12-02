import { getCompanyBySlugAction } from "@/features/companies/actions";
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { notFound } from "next/navigation";

interface EventExperiencesPageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event experiences page
 * Breadcrumbs: Projects > [Project Name] > [Event Name] > Experiences
 */
export default async function EventExperiencesPage({
  params,
}: EventExperiencesPageProps) {
  const { companySlug, projectId, eventId } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project and event when entities exist
  const projectName = `Project ${projectId}`;
  const eventName = `Event ${eventId}`;

  const breadcrumbs = buildBreadcrumbs(company, {
    project: { name: projectName, id: projectId },
    event: { name: eventName, id: eventId },
    current: "Experiences",
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
              Event experiences feature is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
