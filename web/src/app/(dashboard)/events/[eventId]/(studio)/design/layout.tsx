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
}: DesignLayoutProps) {
  
  return (
    <div className="h-full overflow-auto">
      {children}
    </div>
  );
}
