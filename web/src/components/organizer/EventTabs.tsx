"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventTabsProps {
  eventId: string;
}

/**
 * Tab navigation for event pages: Content, Distribute, Results
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 */
export function EventTabs({ eventId }: EventTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Content", href: `/events/${eventId}/content` },
    { label: "Distribute", href: `/events/${eventId}/distribution` },
    { label: "Results", href: `/events/${eventId}/results` },
  ];

  return (
    <nav className="border-b mb-8" role="navigation" aria-label="Event sections">
      <ul className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "inline-block px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                  "hover:text-foreground hover:border-foreground/50",
                  "min-h-[44px] min-w-[44px] flex items-center justify-center",
                  isActive
                    ? "text-foreground border-foreground"
                    : "text-muted-foreground border-transparent"
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
