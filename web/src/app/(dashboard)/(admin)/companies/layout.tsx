import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Companies | Clementine",
  description: "Manage your companies",
}

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
