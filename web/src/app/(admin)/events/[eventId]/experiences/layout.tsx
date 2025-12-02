
"use client";

import { useState, useEffect, createContext, useContext, useMemo } from "react";
import { Menu } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { DesignSidebar } from "@/features/ai-presets";
import type { Experience } from "@/features/ai-presets";

/**
 * Experiences Context for sharing experiences data across design routes
 * Constitution Principle II: Clean Code & Simplicity (avoid prop drilling)
 */
interface ExperiencesContextValue {
  experiences: Experience[];
  eventId: string;
}

const ExperiencesContext = createContext<ExperiencesContextValue | null>(null);

export function useExperiences() {
  const context = useContext(ExperiencesContext);
  if (!context) {
    throw new Error("useExperiences must be used within DesignLayout");
  }
  return context;
}

interface DesignLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

/**
 * Design Layout - provides persistent sidebar and experiences context
 * Part of Phase 2 (Foundational) - Core routing structure
 *
 * Features:
 * - Real-time experiences subscription (persists across routes)
 * - React Context for sharing experiences data
 * - Responsive sidebar (desktop persistent, mobile Sheet)
 * - Auto-cleanup on unmount
 */
export default function DesignLayout({ children, params }: DesignLayoutProps) {
  const [eventId, setEventId] = useState<string>("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Unwrap params promise
  useEffect(() => {
    params.then(({ eventId }) => setEventId(eventId));
  }, [params]);

  // Real-time experience list fetching from root /experiences collection
  // Uses array-contains query on eventIds field (data-model-v4 normalized design)
  useEffect(() => {
    if (!eventId) return;

    const experiencesQuery = query(
      collection(db, "aiPresets"),
      where("eventIds", "array-contains", eventId),
      // orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      experiencesQuery,
      (snapshot) => {
        const experiencesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Experience[];
        setExperiences(experiencesData);
      },
      (error) => {
        console.error("Error fetching experiences:", error);
        toast.error("Failed to load experiences. Please refresh the page.");
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ experiences, eventId }),
    [experiences, eventId]
  );

  // Get current section title for mobile menu
  const getSectionTitle = () => {
    if (pathname.includes("/welcome")) return "Welcome Screen";
    if (pathname.includes("/ending")) return "Ending Screen";
    if (pathname.includes("/experiences/create")) return "Create Experience";
    if (pathname.includes("/experiences/")) return "Edit Experience";
    return "Design";
  };

  // Wait for eventId to be loaded
  if (!eventId) {
    return null;
  }

  return (
    <ExperiencesContext.Provider value={contextValue}>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop sidebar - visible on lg+ screens */}
          <div className="hidden lg:block w-64 shrink-0">
            <DesignSidebar eventId={eventId} experiences={experiences} />
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
                  <SheetTitle>Design Sections</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <DesignSidebar eventId={eventId} experiences={experiences} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </ExperiencesContext.Provider>
  );
}