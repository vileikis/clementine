"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { BuilderSidebar } from "./BuilderSidebar";
import { PreviewPanel } from "./PreviewPanel";
import { WelcomeEditor } from "./WelcomeEditor";
import { ExperienceEditor } from "./ExperienceEditor";
import { ExperienceTypeDialog } from "./ExperienceTypeDialog";
import { EndingEditor } from "./EndingEditor";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createExperience, updateExperience, deleteExperience } from "@/lib/actions/experiences";
import { toast } from "sonner";
import type { Event, Experience } from "@/lib/types/firestore";

type SidebarSection = "welcome" | "experiences" | "survey" | "ending";

interface ContentBuilderProps {
  event: Event;
}

/**
 * ContentBuilder component manages the Content tab builder UI
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 * Enhanced in Phase 6 (User Story 3) - Manage Photo Experiences
 *
 * Features:
 * - Left sidebar with four sections (Welcome, Experiences, Survey, Ending)
 * - Main content area with section-specific forms/controls
 * - Responsive layout (sidebar collapses on mobile)
 * - Real-time experience list fetching
 * - Experience creation, editing, and deletion
 */
export function ContentBuilder({ event }: ContentBuilderProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>("welcome");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [showExperienceTypeDialog, setShowExperienceTypeDialog] = useState(false);

  // Real-time experience list fetching from Firestore subcollection
  useEffect(() => {
    const experiencesQuery = query(
      collection(db, "events", event.id, "experiences"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      experiencesQuery,
      (snapshot) => {
        const experiencesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Experience[];
        setExperiences(experiencesData);

        // Auto-select first experience if none selected
        if (experiencesData.length > 0 && !selectedExperienceId) {
          setSelectedExperienceId(experiencesData[0].id);
        }
      },
      (error) => {
        console.error("Error fetching experiences:", error);
        toast.error("Failed to load experiences. Please refresh the page.");
      }
    );

    return () => unsubscribe();
  }, [event.id, selectedExperienceId]);

  const handleSectionChange = (section: SidebarSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false); // Close mobile menu when section changes
  };

  // Handle experience creation
  const handleCreateExperience = async (type: "photo" | "video" | "gif" | "wheel") => {
    const result = await createExperience(event.id, {
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Experience`,
      type,
      enabled: true,
      aiEnabled: false,
    });

    if (result.success) {
      setShowExperienceTypeDialog(false);
      setSelectedExperienceId(result.data.id);
      toast.success("Experience created successfully.");
    } else {
      toast.error(result.error.message);
    }
  };

  // Handle experience save
  const handleSaveExperience = async (experienceId: string, data: Partial<Experience>) => {
    const result = await updateExperience(event.id, experienceId, data);

    if (!result.success) {
      throw new Error(result.error.message);
    }
  };

  // Handle experience deletion
  const handleDeleteExperience = async (experienceId: string) => {
    const result = await deleteExperience(event.id, experienceId);

    if (result.success) {
      setSelectedExperienceId(null);
      toast.success("Experience deleted successfully.");
    } else {
      throw new Error(result.error.message);
    }
  };

  // Section content renderers with placeholders
  const renderSectionContent = () => {
    switch (activeSection) {
      case "welcome":
        return <WelcomeEditor event={event} />;

      case "experiences":
        const selectedExperience = experiences.find((exp) => exp.id === selectedExperienceId);

        if (!selectedExperience) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  No experience selected. Click + in the sidebar to add your first experience.
                </p>
              </div>
            </div>
          );
        }

        return (
          <ExperienceEditor
            experience={selectedExperience}
            onSave={handleSaveExperience}
            onDelete={handleDeleteExperience}
          />
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
        return <EndingEditor event={event} />;

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

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Desktop sidebar - visible on lg+ screens */}
      <div className="hidden lg:block w-64 shrink-0">
        <BuilderSidebar
          eventId={event.id}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          experiences={experiences}
          selectedExperienceId={selectedExperienceId}
          onExperienceSelect={setSelectedExperienceId}
          onAddExperience={() => setShowExperienceTypeDialog(true)}
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
                experiences={experiences}
                selectedExperienceId={selectedExperienceId}
                onExperienceSelect={setSelectedExperienceId}
                onAddExperience={() => setShowExperienceTypeDialog(true)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {renderSectionContent()}
      </div>

      {/* Experience Type Dialog */}
      <ExperienceTypeDialog
        open={showExperienceTypeDialog}
        onOpenChange={setShowExperienceTypeDialog}
        onSelectType={handleCreateExperience}
      />
    </div>
  );
}
