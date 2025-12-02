import { FolderOpen, Sparkles, BarChart3, Settings } from 'lucide-react';
import type { NavigationItem } from './types';

/**
 * Navigation items displayed in the sidebar.
 * Order matters - items are rendered in array order.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    href: '/projects',
    enabled: true,
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: Sparkles,
    href: '/exps',
    enabled: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    enabled: false,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    enabled: true,
  },
];

/**
 * Sidebar dimension constants
 */
export const SIDEBAR_WIDTH = {
  expanded: 256, // px
  collapsed: 72, // px
} as const;

/**
 * Animation duration in milliseconds
 */
export const SIDEBAR_ANIMATION_DURATION = 200;
