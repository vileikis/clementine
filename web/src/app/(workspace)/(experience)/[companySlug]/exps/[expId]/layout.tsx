import { notFound } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { AppNavbar } from "@/components/shared/AppNavbar";

interface ExperienceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Experience layout - isolated navigation context
 * Breadcrumbs: 🍊 / Company / experiences / Experience Name
 * No tabs - breadcrumbs only
 */
export default async function ExperienceLayout({
  children,
  params,
}: ExperienceLayoutProps) {
  const { companySlug, expId } = await params;

  // Fetch company for breadcrumbs
  const companyResult = await getCompanyBySlugAction(companySlug);
  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // TODO: Fetch experience when entity exists
  const experienceName = `Experience ${expId}`;

  return (
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[
          { label: "\u{1F34A}", href: "/" },
          { label: company.name, href: `/${companySlug}/exps` },
          { label: "experiences", href: `/${companySlug}/exps` },
          { label: experienceName },
        ]}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
