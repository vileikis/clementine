import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { Sidebar, LastCompanyUpdater } from "@/features/sidebar";

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}

/**
 * Company layout - fetches company by slug and provides sidebar navigation
 * Renders 404 if company not found
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

  const company = result.company;

  return (
    <div className="flex h-screen">
      <Sidebar company={company} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
