import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/Breadcrumbs';

interface ContentHeaderProps {
  breadcrumbs: BreadcrumbItem[];
}

/**
 * Content area header with breadcrumbs.
 * Used at the top of the main content area (to the right of sidebar).
 * Breadcrumbs exclude company name since it's shown in the sidebar.
 */
export function ContentHeader({ breadcrumbs }: ContentHeaderProps) {
  return (
    <header className="px-6 py-4 border-b bg-background">
      <Breadcrumbs items={breadcrumbs} />
    </header>
  );
}
