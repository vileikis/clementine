import { useParams } from '@tanstack/react-router'
import { OverlaySection, SharingSection } from '../components'
import { useProjectEvent } from '@/domains/event/shared'
import { useAuth } from '@/domains/auth'
import { useWorkspace } from '@/domains/workspace'

export function EventSettingsPage() {
  const { projectId, eventId, workspaceSlug } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  if (!event || !user || !workspace) {
    return null
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <OverlaySection
          projectId={projectId!}
          eventId={eventId!}
          workspaceId={workspace.id}
          userId={user.uid}
          overlays={event.draftConfig?.overlays || null}
        />

        <SharingSection
          event={event}
          projectId={projectId!}
          eventId={eventId!}
        />
      </div>
    </div>
  )
}
