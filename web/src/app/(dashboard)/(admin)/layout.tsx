"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoutButton } from "@/components/shared/LogoutButton"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isEventsActive = pathname.startsWith("/events")
  const isCompaniesActive = pathname.startsWith("/companies")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Clementine</h1>
          <LogoutButton />
        </div>
        {/* Tab Navigation */}
        <nav className="container mx-auto px-4" role="tablist" aria-label="Admin dashboard navigation">
          <div className="flex gap-6 border-b">
            <Link
              href="/events"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] flex items-center ${
                isEventsActive
                  ? "border-primary text-foreground"
                  : "border-transparent hover:border-primary text-muted-foreground hover:text-foreground"
              }`}
              role="tab"
              aria-selected={isEventsActive}
            >
              Events
            </Link>
            <Link
              href="/companies"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] flex items-center ${
                isCompaniesActive
                  ? "border-primary text-foreground"
                  : "border-transparent hover:border-primary text-muted-foreground hover:text-foreground"
              }`}
              role="tab"
              aria-selected={isCompaniesActive}
            >
              Companies
            </Link>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
