"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DesignSubTabsProps {
  eventId: string;
}

/**
 * Sub-navigation tabs for Design section: Journeys, Experiences, Branding
 * Follows EventTabs component pattern
 */
export function DesignSubTabs({ eventId }: DesignSubTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Journeys", href: `/events/${eventId}/design/journeys` },
    { label: "Experiences", href: `/events/${eventId}/design/experiences` },
    { label: "Branding", href: `/events/${eventId}/design/branding` },
  ];

  return (
    <nav role="navigation" aria-label="Design sections">
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
