"use client";

import { useMemo } from "react";
import { PreviewShell } from "@/features/preview-shell";
import { ThemeProvider, ThemedBackground, useEventTheme } from "@/features/theming";
import type { Experience } from "@/features/experiences";
import { ExperienceCards } from "./ExperienceCards";
import type { EventWelcome, Event } from "../../types/event.types";

interface WelcomePreviewProps {
  /** Welcome form values from React Hook Form watch() */
  welcome: EventWelcome;
  /** Event data for theme and experiences */
  event: Event;
  /** Pre-fetched experience details map */
  experiencesMap: Map<string, Experience>;
}

/**
 * Live preview component for the welcome screen.
 * Renders inside a device frame with event theme applied.
 *
 * Receives welcome values from parent (EventGeneralTab) via form.watch()
 * to enable real-time preview updates as user types.
 */
export function WelcomePreview({
  welcome,
  event,
  experiencesMap,
}: WelcomePreviewProps) {
  // Filter to show only enabled experiences
  const enabledExperiences = useMemo(
    () => event.experiences.filter((exp) => exp.enabled),
    [event.experiences]
  );

  // Get the display title (fall back to event name)
  const displayTitle = welcome.title?.trim() || event.name;

  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <ThemeProvider theme={event.theme}>
        <PreviewContent
          welcome={welcome}
          displayTitle={displayTitle}
          enabledExperiences={enabledExperiences}
          experiencesMap={experiencesMap}
        />
      </ThemeProvider>
    </PreviewShell>
  );
}

/**
 * Inner content component that uses theme context
 */
function PreviewContent({
  welcome,
  displayTitle,
  enabledExperiences,
  experiencesMap,
}: {
  welcome: EventWelcome;
  displayTitle: string;
  enabledExperiences: Event["experiences"];
  experiencesMap: Map<string, Experience>;
}) {
  const { theme } = useEventTheme();

  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="flex h-full flex-col"
    >
      {/* Hero media (image or video) */}
      {welcome.mediaUrl && (
        <div className="relative w-full aspect-video shrink-0 overflow-hidden">
          {welcome.mediaType === "video" ? (
            <video
              src={welcome.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={welcome.mediaUrl}
              alt="Welcome hero"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Content area - centered vertically */}
      <div className="flex flex-1 flex-col justify-center p-4 gap-4 overflow-auto">
        {/* Title */}
        <h1
          className="text-2xl font-bold"
          style={{
            color: theme.text.color,
            textAlign: theme.text.alignment,
          }}
        >
          {displayTitle}
        </h1>

        {/* Description */}
        {welcome.description && (
          <p
            className="text-base"
            style={{
              color: theme.text.color,
              textAlign: theme.text.alignment,
              opacity: 0.9,
            }}
          >
            {welcome.description}
          </p>
        )}

        {/* Experience cards */}
        <div className="mt-2">
          <ExperienceCards
            experiences={enabledExperiences}
            layout={welcome.layout}
            experiencesMap={experiencesMap}
          />
        </div>
      </div>
    </ThemedBackground>
  );
}
