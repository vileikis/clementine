import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { Sidebar, ContentHeader, LastCompanyUpdater } from "@/features/sidebar";

interface ExperienceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Experience layout - sidebar navigation with breadcrumbs in content area
 * Breadcrumbs: Experiences / [Experience Name] (company context in sidebar)
 */
export default async function ExperienceLayout({
  children,
  params,
}: ExperienceLayoutProps) {
  const { companySlug, expId } = await params;

  // Fetch company for sidebar
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch experience when entity exists
  const experienceName = `Experience ${expId}`;

  return (
    <div className="flex h-screen">
      <Sidebar company={company} />
      <main className="flex-1 overflow-auto flex flex-col">
        <ContentHeader
          breadcrumbs={[
            { label: "Experiences", href: `/${companySlug}/exps` },
            { label: experienceName },
          ]}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
