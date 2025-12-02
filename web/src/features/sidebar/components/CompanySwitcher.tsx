'use client';

import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
 * Shows company avatar and name (expanded) or avatar only (collapsed).
 * Clicking opens /companies in a new tab.
 */
export function CompanySwitcher({ company, isCollapsed }: CompanySwitcherProps) {
  const content = (
    <a
      href="/companies"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 px-3 py-2 mx-2 rounded-lg',
        'hover:bg-accent transition-colors min-h-[44px]',
        isCollapsed && 'flex-col gap-1 px-2 justify-center'
      )}
    >
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Building2 className="h-4 w-4 text-primary" />
      </div>
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{company.name}</span>
      )}
    </a>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{company.name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
