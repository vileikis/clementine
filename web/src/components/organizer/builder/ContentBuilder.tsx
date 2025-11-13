"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderContent } from "./BuilderContent";
import { PreviewPanel } from "./PreviewPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Event } from "@/lib/types/firestore";

type SidebarSection = "welcome" | "experiences" | "survey" | "ending";

interface ContentBuilderProps {
  event: Event;
}

/**
 * ContentBuilder component manages the Content tab builder UI
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 *
 * Features:
 * - Left sidebar with four sections (Welcome, Experiences, Survey, Ending)
 * - Main content area with section-specific forms/controls
 * - Responsive layout (sidebar collapses on mobile)
 */
export function ContentBuilder({ event }: ContentBuilderProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>("welcome");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSectionChange = (section: SidebarSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false); // Close mobile menu when section changes
  };

  // Section content renderers with placeholders
  const renderSectionContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure the welcome screen that guests see when they join your event.
            </p>
            <PreviewPanel title="Welcome Preview">
              <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-primary/10 to-background">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold">
                    {event.welcomeTitle || "Welcome to the event!"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {event.welcomeDescription ||
                      "Take a photo and get an AI-transformed result."}
                  </p>
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                    {event.welcomeCtaLabel || "Get Started"}
                  </button>
                </div>
              </div>
            </PreviewPanel>
            <div className="border rounded-lg p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Welcome editor controls will be implemented in Phase 5 (User Story 2)
              </p>
            </div>
          </div>
        );

      case "experiences":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Add and configure photo experiences for your guests.
            </p>
            <div className="border rounded-lg p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Experiences list and editor will be implemented in Phase 6 (User Story 3)
              </p>
            </div>
          </div>
        );

      case "survey":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Add survey questions to collect feedback from guests.
            </p>
            <div className="border rounded-lg p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Survey configuration will be implemented in Phase 7 (User Story 4)
              </p>
            </div>
          </div>
        );

      case "ending":
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configure the ending screen and share options.
            </p>
            <PreviewPanel title="Ending Preview">
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold">
                    {event.endHeadline || "Thanks for participating!"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {event.endBody || "Share your result with friends."}
                  </p>
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                    {event.endCtaLabel || "Share Now"}
                  </button>
                </div>
              </div>
            </PreviewPanel>
            <div className="border rounded-lg p-6 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Ending editor controls will be implemented in Phase 8 (User Story 5)
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "welcome":
        return "Welcome Screen";
      case "experiences":
        return "Photo Experiences";
      case "survey":
        return "Survey Configuration";
      case "ending":
        return "Ending Screen";
      default:
        return "";
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case "welcome":
        return "Configure the welcome screen that guests see first";
      case "experiences":
        return "Add and configure photo experiences for your event";
      case "survey":
        return "Collect feedback with custom survey questions";
      case "ending":
        return "Configure the ending screen and share options";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Desktop sidebar - visible on lg+ screens */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <BuilderSidebar
          eventId={event.id}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Mobile menu button - visible on mobile only */}
      <div className="lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="w-full justify-start gap-2 min-h-[44px]"
            >
              <Menu className="h-4 w-4" />
              <span>{getSectionTitle()}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Content Sections</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <BuilderSidebar
                eventId={event.id}
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        <BuilderContent
          title={getSectionTitle()}
          description={getSectionDescription()}
        >
          {renderSectionContent()}
        </BuilderContent>
      </div>
    </div>
  );
}
