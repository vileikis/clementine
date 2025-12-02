import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { Sidebar, LastCompanyUpdater } from "@/features/sidebar";

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}

/**
 * Unified company layout - single layout for all workspace routes under [companySlug]
 * Replaces separate layouts in (company), (project), (event), (experience) route groups
 *
 * Responsibilities:
 * - Fetch company by slug (Next.js automatically deduplicates this call across
 *   layout and child pages within the same request - see React Server Components docs)
 * - Render sidebar with company context
 * - Track last visited company for quick switching
 *
 * Breadcrumbs are now handled by individual pages using buildBreadcrumbs helper.
 * Pages fetch company data individually, but Next.js deduplicates the request,
 * so no additional network calls are made.
 */
export default async function CompanyLayout({
  children,
  params,
}: CompanyLayoutProps) {
  const { companySlug } = await params;
  const result = await getCompanyBySlugAction(companySlug);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="flex h-screen">
      <Sidebar company={result.company} />
      <main className="flex-1 overflow-auto">{children}</main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
