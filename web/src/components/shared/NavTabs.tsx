"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string; // Relative to basePath
}

interface NavTabsProps {
  tabs: TabItem[];
  basePath: string;
}

/**
 * Generic horizontal tab navigation with active state detection
 * Mobile-friendly with horizontal scroll and 44px touch targets
 */
export function NavTabs({ tabs, basePath }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 overflow-x-auto" aria-label="Section navigation">
      {tabs.map((tab) => {
        const fullHref = `${basePath}${tab.href}`;
        const isActive = pathname.startsWith(fullHref);

        return (
          <Link
            key={tab.href}
            href={fullHref}
            className={cn(
              "py-2 px-1 text-sm whitespace-nowrap min-h-[44px] flex items-center",
              isActive
                ? "border-b-2 border-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
