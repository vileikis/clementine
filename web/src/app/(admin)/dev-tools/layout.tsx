/**
 * Dev Tools Layout
 *
 * Layout for development tools pages with tab navigation.
 * Development-only - not visible in production.
 */

import { NavTabs, TabItem } from "@/components/shared/NavTabs";

const devToolsTabs: TabItem[] = [
  { label: "Camera", href: "/camera" },
  { label: "Web API", href: "/web-api" },
];

export default function DevToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 pt-4">
          <h1 className="text-xl font-semibold">Dev Tools</h1>
          <div className="mt-4">
            <NavTabs tabs={devToolsTabs} basePath="/dev-tools" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
