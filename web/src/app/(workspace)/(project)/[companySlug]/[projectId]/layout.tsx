import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { Sidebar, ContentHeader, LastCompanyUpdater } from "@/features/sidebar";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; projectId: string }>;
}

/**
 * Project layout - sidebar navigation with breadcrumbs in content area
 * Breadcrumbs: Projects / [Project Name] (company context in sidebar)
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { companySlug, projectId } = await params;

  // Fetch company for sidebar
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch project when Projects entity exists
  // For now, use projectId as placeholder name
  const projectName = `Project ${projectId}`;

  return (
    <div className="flex h-screen">
      <Sidebar company={company} />
      <main className="flex-1 overflow-auto flex flex-col">
        <ContentHeader
          breadcrumbs={[
            { label: "Projects", href: `/${companySlug}/projects` },
            { label: projectName },
          ]}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
