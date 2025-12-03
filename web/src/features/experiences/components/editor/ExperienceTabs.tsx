"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ExperienceTabsProps {
  companySlug: string;
  experienceId: string;
}

export function ExperienceTabs({ companySlug, experienceId }: ExperienceTabsProps) {
  const pathname = usePathname();
  
  const tabs = [
    { label: "Design", href: `/${companySlug}/exps/${experienceId}/design` },
    { label: "Settings", href: `/${companySlug}/exps/${experienceId}/settings` },
  ];

  return (
    <nav role="navigation" aria-label="Experience sections">
      <ul className="flex gap-8">
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