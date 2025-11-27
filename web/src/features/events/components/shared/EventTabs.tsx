"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventTabsProps {
  eventId: string;
}

/**
 * Tab navigation for event pages: Design, Distribute, Results
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 * Updated in Phase 3 (User Story 4) - Rename Content to Design
 */
export function EventTabs({ eventId }: EventTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Journeys", href: `/events/${eventId}/design/journeys` },
    { label: "Experiences", href: `/events/${eventId}/design/experiences` },
    { label: "Theme", href: `/events/${eventId}/design/theme` },
    { label: "Distribute", href: `/events/${eventId}/distribution` },
    { label: "Results", href: `/events/${eventId}/results` },
  ];

  return (
    <nav role="navigation" aria-label="Event sections">
      <ul className="flex gap-6">
        {tabs.map((tab) => {
          // Check if current pathname starts with the tab href (for nested routes)
          const isActive = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "inline-block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "min-h-[40px] min-w-[40px] flex items-center justify-center",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
