"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experience } from "@/features/experiences";

interface DesignSidebarProps {
  eventId: string;
  experiences: Experience[];
  className?: string;
}

/**
 * DesignSidebar component for Design tab navigation
 * Part of Phase 2 (Foundational) - Core routing structure
 * Enhanced in Phase 3 (User Story 1) - URL-based highlighting
 * Enhanced in Phase 5 (User Story 3) - Permanent experiences list
 *
 * Displays design sections:
 * - Welcome: Configure welcome screen
 * - Experiences: List of all experiences (always visible)
 * - Ending: Configure ending screen
 */
export function DesignSidebar({
  eventId,
  experiences,
  className,
}: DesignSidebarProps) {
  const pathname = usePathname();

  const sections = [
    {
      id: "welcome",
      label: "Welcome",
      description: "Welcome screen configuration",
      href: `/events/${eventId}/design/welcome`,
    },
    {
      id: "ending",
      label: "Ending",
      description: "Ending screen & share options",
      href: `/events/${eventId}/design/ending`,
    },
  ];

  // Check if a given path is active
  const isActive = (href: string) => pathname === href;
  const isExperienceActive = (experienceId: string) =>
    pathname === `/events/${eventId}/design/experiences/${experienceId}`;

  return (
    <aside
      className={cn("flex flex-col gap-2 py-4", className)}
      aria-label="Design sections"
    >
      <nav>
        <ul className="space-y-1">
          {/* Welcome section */}
          <li>
            <Link
              href={sections[0].href}
              className={cn(
                "block w-full text-left px-4 py-3 rounded-md transition-colors",
                "min-h-[44px] flex flex-col gap-0.5",
                "hover:bg-accent hover:text-accent-foreground",
                isActive(sections[0].href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
              aria-current={isActive(sections[0].href) ? "page" : undefined}
            >
              <span className="text-sm font-medium">{sections[0].label}</span>
              <span className="text-xs text-muted-foreground">
                {sections[0].description}
              </span>
            </Link>
          </li>

          {/* Experiences section - always expanded */}
          <li className="space-y-1">
            {/* Experiences header with add button */}
            <div className="px-4 py-3 min-h-[44px] flex items-center justify-between">
              <span className="text-sm font-medium">Experiences</span>
              <Link href={`/events/${eventId}/design/experiences/create`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Add experience"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Experiences list - always visible */}
            <div className="flex flex-col gap-2">
              {/* Experiences List */}
              {experiences.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No experiences yet. Click + to add your first one.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {experiences.map((experience) => (
                    <li key={experience.id}>
                      <Link
                        href={`/events/${eventId}/design/experiences/${experience.id}`}
                        className={cn(
                          "block w-full text-left px-4 py-2.5 rounded-md transition-colors",
                          "min-h-[44px] flex items-center gap-2",
                          "hover:bg-accent hover:text-accent-foreground",
                          isExperienceActive(experience.id)
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                        aria-current={
                          isExperienceActive(experience.id) ? "page" : undefined
                        }
                      >
                        {/* Experience Icon based on type */}
                        <span className="text-base" aria-hidden="true">
                          {experience.type === "photo" && "📷"}
                          {experience.type === "video" && "🎥"}
                          {experience.type === "gif" && "🎞️"}
                          {experience.type === "wheel" && "🎡"}
                        </span>

                        {/* Experience Label */}
                        <span className="text-sm flex-1 truncate">
                          {experience.label}
                        </span>

                        {/* Enabled/Disabled Indicator */}
                        {!experience.enabled && (
                          <span className="text-xs text-muted-foreground">
                            (Disabled)
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>

          {/* Ending section */}
          <li>
            <Link
              href={sections[1].href}
              className={cn(
                "block w-full text-left px-4 py-3 rounded-md transition-colors",
                "min-h-[44px] flex flex-col gap-0.5",
                "hover:bg-accent hover:text-accent-foreground",
                isActive(sections[1].href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
              aria-current={isActive(sections[1].href) ? "page" : undefined}
            >
              <span className="text-sm font-medium">{sections[1].label}</span>
              <span className="text-xs text-muted-foreground">
                {sections[1].description}
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
