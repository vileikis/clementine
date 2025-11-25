"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experience } from "../../schemas";

interface ExperiencesSidebarProps {
  eventId: string;
  experiences: Experience[];
  className?: string;
}

/**
 * DesignSidebar component for experiences navigation
 * Displays a header with add button and list of experiences
 */
export function ExperiencesSidebar({
  eventId,
  experiences,
  className,
}: ExperiencesSidebarProps) {
  const pathname = usePathname();

  const isExperienceActive = (experienceId: string) =>
    pathname === `/events/${eventId}/design/experiences/${experienceId}`;

  return (
    <aside
      className={cn("flex flex-col gap-2 py-4", className)}
      aria-label="Experiences"
    >
      {/* Header with add button */}
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

      {/* Experiences list */}
      <nav>
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
                    {experience.type === "photo"
                      ? "📷"
                      : experience.type === "video"
                        ? "🎥"
                        : experience.type === "gif"
                          ? "🎞️"
                          : null}
                  </span>

                  {/* Experience Name */}
                  <span className="text-sm flex-1 truncate">
                    {experience.name}
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
      </nav>
    </aside>
  );
}