"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { EditorHeader } from "@/components/shared";

interface ExperienceEditorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string; experienceId: string }>;
}

/**
 * Experience Editor Layout
 * Fullscreen editor with minimal header and breadcrumbs
 */
export default function ExperienceEditorLayout({
  children,
  params,
}: ExperienceEditorLayoutProps) {
  const router = useRouter();
  const [eventId, setEventId] = React.useState<string>("");
  const [experienceId, setExperienceId] = React.useState<string>("");

  // Unwrap params
  React.useEffect(() => {
    params.then(({ eventId, experienceId }) => {
      setEventId(eventId);
      setExperienceId(experienceId);
    });
  }, [params]);

  const handleSave = () => {
    // TODO: Implement save logic in future
    console.log("Save experience", experienceId);
  };

  const handleExit = () => {
    router.push(`/events/${eventId}/design/experiences`);
  };

  if (!eventId || !experienceId) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <EditorHeader
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: "Event", href: `/events/${eventId}/design` },
          { label: `Experience ${experienceId}` },
        ]}
        onSave={handleSave}
        onExit={handleExit}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
