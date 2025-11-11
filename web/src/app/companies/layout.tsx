import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Companies | Clementine",
  description: "Manage your companies",
}

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Clementine</h1>
        </div>
        {/* Tab Navigation */}
        <nav className="container mx-auto px-4" role="tablist" aria-label="Admin dashboard navigation">
          <div className="flex gap-6 border-b">
            <Link
              href="/events"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors min-h-[44px] flex items-center"
              role="tab"
            >
              Events
            </Link>
            <Link
              href="/companies"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors min-h-[44px] flex items-center"
              role="tab"
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
