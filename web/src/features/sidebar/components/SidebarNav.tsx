'use client';

import { NAVIGATION_ITEMS } from '../constants';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarNavProps {
  basePath: string;
  isCollapsed: boolean;
}

/**
 * Navigation items list in the sidebar.
 * Renders all navigation items from constants.
 */
export function SidebarNav({ basePath, isCollapsed }: SidebarNavProps) {
  return (
    <nav className="flex-1 px-2 py-2 space-y-1">
      {NAVIGATION_ITEMS.map((item) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          basePath={basePath}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
}
