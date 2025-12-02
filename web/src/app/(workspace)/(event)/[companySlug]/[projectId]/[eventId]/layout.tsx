import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { Sidebar, ContentHeader, LastCompanyUpdater } from "@/features/sidebar";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event layout - sidebar navigation with breadcrumbs in content area
 * Breadcrumbs: Projects / [Project] / [Event] (company context in sidebar)
 */
export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { companySlug, projectId, eventId } = await params;

  // Fetch company for sidebar
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project and event when entities exist
  const projectName = `Project ${projectId}`;
  const eventName = `Event ${eventId}`;

  return (
    <div className="flex h-screen">
      <Sidebar company={company} />
      <main className="flex-1 overflow-auto flex flex-col">
        <ContentHeader
          breadcrumbs={[
            { label: "Projects", href: `/${companySlug}/projects` },
            { label: projectName, href: `/${companySlug}/${projectId}/events` },
            { label: eventName },
          ]}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
