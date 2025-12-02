'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '@/features/sidebar';

interface LastCompanyUpdaterProps {
  companySlug: string;
}

/**
 * Client component that updates the last visited company slug in Zustand store.
 * Renders nothing - purely for side effects.
 */
export function LastCompanyUpdater({ companySlug }: LastCompanyUpdaterProps) {
  const setLastCompanySlug = useSidebarStore((s) => s.setLastCompanySlug);

  useEffect(() => {
    setLastCompanySlug(companySlug);
  }, [companySlug, setLastCompanySlug]);

  return null;
}
