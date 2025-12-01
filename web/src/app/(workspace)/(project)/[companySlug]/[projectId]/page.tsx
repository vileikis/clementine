import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ companySlug: string; projectId: string }>;
}

/**
 * Project root page - redirects to events
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { companySlug, projectId } = await params;
  redirect(`/${companySlug}/${projectId}/events`);
}
