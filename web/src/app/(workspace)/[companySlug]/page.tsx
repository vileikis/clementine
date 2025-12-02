import { redirect } from "next/navigation";

interface CompanyPageProps {
  params: Promise<{ companySlug: string }>;
}

/**
 * Company root page - redirects to projects
 */
export default async function CompanyPage({ params }: CompanyPageProps) {
  const { companySlug } = await params;
  redirect(`/${companySlug}/projects`);
}
