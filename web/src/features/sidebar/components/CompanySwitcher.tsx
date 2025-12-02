'use client';

import { ChevronDown } from 'lucide-react';

interface CompanySwitcherProps {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  isCollapsed: boolean;
}

/**
 * Company switcher component in the sidebar.
 * Shows company name with dropdown indicator (expanded only).
 * Clicking opens /companies in a new tab.
 * Hidden when sidebar is collapsed.
 */
export function CompanySwitcher({ company, isCollapsed }: CompanySwitcherProps) {
  // Hide in collapsed mode
  if (isCollapsed) {
    return null;
  }

  return (
    <a
      href="/companies"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 px-3 py-2 mx-2 rounded-lg hover:bg-accent transition-colors min-h-[44px]"
    >
      <span className="text-base font-semibold truncate">{company.name}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
    </a>
  );
}
