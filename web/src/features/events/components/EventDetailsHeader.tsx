"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface EventDetailsHeaderProps {
  companySlug: string;
  projectId: string;
  eventId: string;
  projectName: string;
  eventName: string;
}

/**
 * Event details header with breadcrumbs and tab navigation.
 *
 * Breadcrumbs: Project Name / Event Name
 * Tabs: Experiences | Theme
 */
export function EventDetailsHeader({
  companySlug,
  projectId,
  eventId,
  projectName,
  eventName,
}: EventDetailsHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Experiences",
      href: `/${companySlug}/${projectId}/${eventId}/experiences`,
    },
    {
      name: "Theme",
      href: `/${companySlug}/${projectId}/${eventId}/theme`,
    },
  ];

  // Determine active tab from pathname
  const activeTab = pathname?.includes("/theme") ? "Theme" : "Experiences";

  return (
    <header className="bg-background border-b">
      {/* Breadcrumbs */}
      <div className="px-6 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/${companySlug}/${projectId}/events`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {projectName}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{eventName}</span>
        </nav>
      </div>

      {/* Tab Navigation */}
      <div className="px-6">
        <nav className="flex gap-6" aria-label="Event tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
