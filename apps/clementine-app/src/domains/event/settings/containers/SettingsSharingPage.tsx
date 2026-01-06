import { useParams } from '@tanstack/react-router'
import { SharingSection } from '../components'
import { OverlaySection } from './OverlaySection'
import { useProjectEvent } from '@/domains/event/shared'
import { useAuth } from '@/domains/auth'
import { useWorkspace } from '@/domains/workspace'

export function SettingsSharingPage() {
  const { projectId, eventId, workspaceSlug } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  if (!event || !user || !workspace) {
    return null
  }

  return (
    <div className="space-y-8 p-6">
      <OverlaySection
        projectId={projectId!}
        eventId={eventId!}
        workspaceId={workspace.id}
        userId={user.uid}
        overlays={event.draftConfig?.overlays || null}
      />

      <SharingSection event={event} projectId={projectId!} eventId={eventId!} />
    </div>
  )
}
