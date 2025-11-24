"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { EditorHeader } from "@/components/shared";

interface JourneyEditorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string; journeyId: string }>;
}

/**
 * Journey Editor Layout
 * Fullscreen editor with minimal header and breadcrumbs
 */
export default function JourneyEditorLayout({
  children,
  params,
}: JourneyEditorLayoutProps) {
  const router = useRouter();
  const [eventId, setEventId] = React.useState<string>("");
  const [journeyId, setJourneyId] = React.useState<string>("");

  // Unwrap params
  React.useEffect(() => {
    params.then(({ eventId, journeyId }) => {
      setEventId(eventId);
      setJourneyId(journeyId);
    });
  }, [params]);

  const handleSave = () => {
    // TODO: Implement save logic in future
    console.log("Save journey", journeyId);
  };

  const handleExit = () => {
    router.push(`/events/${eventId}/design/journeys`);
  };

  if (!eventId || !journeyId) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <EditorHeader
        breadcrumbs={[
          { label: "Events", href: "/events" },
          { label: "Event", href: `/events/${eventId}/design` },
          { label: `Journey ${journeyId}` },
        ]}
        onSave={handleSave}
        onExit={handleExit}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
