import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";
import { NavTabs, type TabItem } from "./NavTabs";

interface AppNavbarProps {
  breadcrumbs: BreadcrumbItem[];
  tabs?: TabItem[];
  basePath?: string;
  actions?: React.ReactNode;
}

/**
 * @deprecated Use Sidebar + ContentHeader from @/features/sidebar instead.
 * This component is kept for legacy admin layouts only.
 * Combined navigation bar with breadcrumbs and optional tabs.
 */
export function AppNavbar({
  breadcrumbs,
  tabs,
  basePath,
  actions,
}: AppNavbarProps) {
  return (
    <header className="border-b bg-background">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs items={breadcrumbs} />
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {tabs && basePath && (
          <div className="mt-2 -mb-3">
            <NavTabs tabs={tabs} basePath={basePath} />
          </div>
        )}
      </div>
    </header>
  );
}
