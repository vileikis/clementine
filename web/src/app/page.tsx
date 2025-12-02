'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/features/sidebar';
import { getCompanyBySlugAction } from '@/features/companies/actions';

/**
 * Root page - smart redirect based on last visited company
 * - If lastCompanySlug exists and is valid, redirect to /{slug}/projects
 * - If no slug or slug invalid, redirect to /companies
 */
export default function RootPage() {
  const router = useRouter();
  const lastCompanySlug = useSidebarStore((s) => s.lastCompanySlug);
  const clearLastCompanySlug = useSidebarStore((s) => s.clearLastCompanySlug);

  useEffect(() => {
    async function handleRedirect() {
      if (!lastCompanySlug) {
        router.replace('/companies');
        return;
      }

      // Validate the stored slug
      const result = await getCompanyBySlugAction(lastCompanySlug);

      if (result.success && result.company) {
        router.replace(`/${lastCompanySlug}/projects`);
      } else {
        // Invalid slug - clear and redirect to companies
        clearLastCompanySlug();
        router.replace('/companies');
      }
    }

    handleRedirect();
  }, [lastCompanySlug, clearLastCompanySlug, router]);

  // Brief loading state during redirect
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
