import { redirect } from "next/navigation";

interface ExperiencePageProps {
  params: Promise<{ companySlug: string; expId: string }>;
}

/**
 * Experience base page - redirects to /design tab.
 * The layout handles data fetching and validation.
 */
export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { companySlug, expId } = await params;
  redirect(`/${companySlug}/exps/${expId}/design`);
}
