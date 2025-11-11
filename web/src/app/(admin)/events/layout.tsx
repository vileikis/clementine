import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events | Clementine",
  description: "Manage your AI photobooth events",
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
