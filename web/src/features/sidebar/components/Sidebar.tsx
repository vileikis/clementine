'use client';

import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '../stores';
import { SIDEBAR_WIDTH, SIDEBAR_ANIMATION_DURATION } from '../constants';
import { SidebarNav } from './SidebarNav';
import { CompanySwitcher } from './CompanySwitcher';
import { SidebarLogout } from './SidebarLogout';

interface SidebarProps {
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Main sidebar container with collapse/expand functionality.
 * Features: hamburger toggle, company switcher, navigation items, logout button.
 */
export function Sidebar({ company }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-background border-r shrink-0',
        'transition-[width] ease-out'
      )}
      style={{
        width: isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded,
        transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
      }}
    >
      {/* Hamburger toggle */}
      <div className="px-2 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-11 w-11"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Company switcher */}
      <CompanySwitcher company={company} isCollapsed={isCollapsed} />

      {/* Navigation items */}
      <SidebarNav basePath={`/${company.slug}`} isCollapsed={isCollapsed} />

      {/* Logout button at bottom */}
      <SidebarLogout isCollapsed={isCollapsed} />
    </aside>
  );
}
