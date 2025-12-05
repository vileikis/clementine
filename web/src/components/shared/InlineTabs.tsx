"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string;
}

interface InlineTabsProps {
  tabs: TabItem[];
  ariaLabel?: string;
  className?: string;
}

export function InlineTabs({
  tabs,
  ariaLabel = "Section navigation",
  className,
}: InlineTabsProps) {
  const pathname = usePathname();

  return (
    <nav role="navigation" aria-label={ariaLabel} className={className}>
      <ul className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "inline-flex items-center justify-center",
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "min-h-[44px] min-w-[44px]",
                  "hover:bg-accent hover:text-accent-foreground",
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
