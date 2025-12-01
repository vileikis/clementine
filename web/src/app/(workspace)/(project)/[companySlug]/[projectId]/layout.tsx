import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { AppNavbar } from "@/components/shared/AppNavbar";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; projectId: string }>;
}

/**
 * Project layout - isolated navigation context (no layout stacking)
 * Breadcrumbs: 🍊 / Company / Project
 * Tabs: Events, Distribute, Results
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { companySlug, projectId } = await params;

  // Fetch company for breadcrumbs
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project when Projects entity exists
  // For now, use projectId as placeholder name
  const projectName = `Project ${projectId}`;

  return (
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[
          { label: "\u{1F34A}", href: "/" },
          { label: company.name, href: `/${companySlug}/projects` },
          { label: projectName },
        ]}
        tabs={[
          { label: "Events", href: "/events" },
          { label: "Distribute", href: "/distribute" },
          { label: "Results", href: "/results" },
        ]}
        basePath={`/${companySlug}/${projectId}`}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
