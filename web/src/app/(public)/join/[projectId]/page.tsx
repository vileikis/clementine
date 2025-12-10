import { getProjectAction } from "@/features/projects/actions"
import { notFound } from "next/navigation"
import {
  BrandThemeProvider,
} from "@/features/guest"

interface JoinPageProps {
  params: Promise<{ projectId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { projectId } = await params
  const result = await getProjectAction(projectId)

  if (!result.success || !result.project) {
    notFound()
  }

  const project = result.project

  return (
    <BrandThemeProvider brandColor={project.theme.primaryColor}>
      <div className="min-h-screen bg-black">
        <h1 className="text-white text-2xl font-bold">WIP: Join Page</h1>
      </div>
    </BrandThemeProvider>
  )
}
