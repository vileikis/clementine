import type { LucideIcon } from 'lucide-react';

/**
 * Sidebar collapse/expand state persisted to localStorage
 */
export interface SidebarState {
  /** Whether the sidebar is collapsed (icons only) or expanded (full width) */
  isCollapsed: boolean;
  /** Most recently accessed company slug for root URL redirect */
  lastCompanySlug: string | null;
}

/**
 * Actions available on the sidebar store
 */
export interface SidebarActions {
  /** Toggle sidebar between collapsed and expanded */
  toggleCollapsed: () => void;
  /** Set collapsed state explicitly */
  setCollapsed: (collapsed: boolean) => void;
  /** Set the last accessed company slug */
  setLastCompanySlug: (slug: string) => void;
  /** Clear the last company slug (e.g., on invalid slug) */
  clearLastCompanySlug: () => void;
}

/**
 * Combined Zustand store type
 */
export type SidebarStore = SidebarState & SidebarActions;

/**
 * Represents a single navigation item in the sidebar
 */
export interface NavigationItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** URL path segment (appended to company base path) */
  href: string;
  /** Whether the item is enabled (clickable) */
  enabled: boolean;
}
