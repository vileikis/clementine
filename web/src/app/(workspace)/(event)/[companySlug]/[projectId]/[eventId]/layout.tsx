import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { AppNavbar } from "@/components/shared/AppNavbar";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}

/**
 * Event layout - isolated navigation context
 * Breadcrumbs: 🍊 / Company / Project / Event
 * Tabs: Experiences, Theme
 */
export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { companySlug, projectId, eventId } = await params;

  // Fetch company for breadcrumbs
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project and event when entities exist
  const projectName = `Project ${projectId}`;
  const eventName = `Event ${eventId}`;

  return (
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[
          { label: "\u{1F34A}", href: "/" },
          { label: company.name, href: `/${companySlug}/projects` },
          { label: projectName, href: `/${companySlug}/${projectId}/events` },
          { label: eventName },
        ]}
        tabs={[
          { label: "Experiences", href: "/experiences" },
          { label: "Theme", href: "/theme" },
        ]}
        basePath={`/${companySlug}/${projectId}/${eventId}`}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
