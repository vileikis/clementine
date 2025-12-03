import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getProjectAction } from "@/features/projects/actions";
import { getEventAction } from "@/features/events/actions";
import { EventThemeEditor } from "@/features/events/components/designer/EventThemeEditor";
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { notFound } from "next/navigation";

interface ThemePageProps {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event theme page
 * Breadcrumbs: Projects > [Project Name] > [Event Name] > Theme
 */
export default async function ThemePage({ params }: ThemePageProps) {
  const { companySlug, projectId, eventId } = await params;

  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // Fetch project
  const projectResult = await getProjectAction(projectId);
  if (!projectResult.success || !projectResult.project) {
    notFound();
  }

  const project = projectResult.project;

  // Fetch event
  const eventResult = await getEventAction(projectId, eventId);
  if (!eventResult.success || !eventResult.data?.event) {
    notFound();
  }

  const event = eventResult.data.event;

  const breadcrumbs = buildBreadcrumbs(company, {
    project: { name: project.name, id: projectId },
    event: { name: event.name, id: eventId },
    current: "Theme",
  });

  return (
    <div className="flex flex-col h-full">
      <ContentHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto p-6">
        <EventThemeEditor event={event} projectId={projectId} />
      </div>
    </div>
  );
}
