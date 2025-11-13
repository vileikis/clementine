"use client";

import { cn } from "@/lib/utils";

type SidebarSection = "welcome" | "experiences" | "survey" | "ending";

interface BuilderSidebarProps {
  eventId: string;
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  className?: string;
}

/**
 * BuilderSidebar component for Content tab navigation
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 *
 * Displays four main sections:
 * - Welcome: Configure welcome screen
 * - Experiences: Manage photo experiences
 * - Survey: Configure survey steps
 * - Ending: Configure ending screen
 */
export function BuilderSidebar({
  eventId,
  activeSection,
  onSectionChange,
  className,
}: BuilderSidebarProps) {
  const sections: { id: SidebarSection; label: string; description: string }[] = [
    {
      id: "welcome",
      label: "Welcome",
      description: "Welcome screen configuration",
    },
    {
      id: "experiences",
      label: "Experiences",
      description: "Photo experiences",
    },
    {
      id: "survey",
      label: "Survey",
      description: "Survey configuration",
    },
    {
      id: "ending",
      label: "Ending",
      description: "Ending screen & share options",
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col gap-2 py-4",
        className
      )}
      aria-label="Builder sections"
    >
      <nav>
        <ul className="space-y-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md transition-colors",
                    "min-h-[44px] flex flex-col gap-0.5",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="text-sm font-medium">{section.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {section.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
