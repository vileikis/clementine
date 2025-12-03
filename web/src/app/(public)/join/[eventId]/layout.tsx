import { getProjectAction } from "@/features/projects/actions"
import { notFound } from "next/navigation"

interface JoinLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

export default async function JoinLayout({
  children,
  params,
}: JoinLayoutProps) {
  const { eventId } = await params
  const result = await getProjectAction(eventId)

  if (!result.success || !result.project) {
    notFound()
  }

  const project = result.project

  // Validate project is live
  if (project.status !== "live") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Experience Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {project.status === "draft"
              ? "This experience is not yet live. Please check back later."
              : "This experience has been archived and is no longer accepting guests."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
