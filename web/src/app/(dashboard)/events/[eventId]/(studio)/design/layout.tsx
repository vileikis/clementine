import { DesignSubTabs } from "@/features/events";

interface DesignLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

/**
 * Design Layout - Sub-navigation for Journeys, Experiences, Branding
 * Renders tabs as an additional row below the event navigation bar
 */
export default async function DesignLayout({
  children,
  params,
}: DesignLayoutProps) {
  const { eventId } = await params;

  return (
    <>
      {/* Design Sub-Navigation - sticky below event nav */}
      <div className="border-b bg-background sticky top-[73px] z-10">
        <div className="container mx-auto px-6 py-3">
          <DesignSubTabs eventId={eventId} />
        </div>
      </div>

      {/* Main content area */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </>
  );
}
