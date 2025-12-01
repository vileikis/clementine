import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { AppNavbar } from "@/components/shared/AppNavbar";
import { LogoutButton } from "@/components/shared/LogoutButton";

interface CompanyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}

/**
 * Company layout - fetches company by slug and provides navigation context
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
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[
          { label: "\u{1F34A}", href: "/", isLogo: true },
          { label: company.name },
        ]}
        tabs={[
          { label: "Projects", href: "/projects" },
          { label: "Experiences", href: "/exps" },
          { label: "Settings", href: "/settings" },
        ]}
        basePath={`/${companySlug}`}
        actions={<LogoutButton />}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
