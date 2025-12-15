"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RenameEventDialog } from "./RenameEventDialog";
import type { Event } from "../types/event.types";

interface EventDetailsHeaderProps {
  companySlug: string;
  projectId: string;
  event: Event;
  projectName: string;
}

/**
 * Event details header with back button, editable title, and tab navigation.
 *
 * Features:
 * - Back arrow to project events list
 * - Clickable event name (opens rename dialog)
 * - Breadcrumb showing project name
 * - Tabs: General | Theme | Overlays
 */
export function EventDetailsHeader({
  companySlug,
  projectId,
  event,
  projectName,
}: EventDetailsHeaderProps) {
  const pathname = usePathname();
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const tabs = [
    {
      name: "General",
      href: `/${companySlug}/${projectId}/${event.id}/general`,
      segment: "general",
    },
    {
      name: "Overlays",
      href: `/${companySlug}/${projectId}/${event.id}/overlays`,
      segment: "overlays",
    },
    {
      name: "Theme",
      href: `/${companySlug}/${projectId}/${event.id}/theme`,
      segment: "theme",
    },
  ];

  // Determine which tab is active based on URL segment
  const activeTab = tabs.find((tab) => pathname?.includes(`/${tab.segment}`))?.name || "General";

  return (
    <>
      <header className="bg-background">
        {/* Top row: Back button, title, actions */}
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Back Button */}
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
            <Link href={`/${companySlug}/${projectId}/events`}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to events</span>
            </Link>
          </Button>

          {/* Event Name - Clickable to rename */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setIsRenameOpen(true)}
              className="text-left hover:bg-accent px-2 py-1 -ml-2 rounded-md transition-colors"
            >
              <h1 className="text-3xl font-semibold truncate ">{event.name}</h1>
              {/* <p className="text-xs text-muted-foreground">{projectName}</p> */}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b px-4">
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

      {/* Rename Dialog */}
      <RenameEventDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        event={event}
        projectId={projectId}
      />
    </>
  );
}
