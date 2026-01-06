import { useParams } from '@tanstack/react-router'
import { SharingSection } from '../components'
import { OverlaySection } from './OverlaySection'
import { useProjectEvent } from '@/domains/event/shared'
import { useAuth } from '@/domains/auth'

export function SettingsSharingPage() {
  const { projectId, eventId } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)
  const { user } = useAuth()

  if (!event || !user) return null

  // TODO: Get workspaceId from project or workspace context
  // For now, this needs to be provided by the route/context
  const workspaceId = 'PLACEHOLDER_WORKSPACE_ID'

  return (
    <div className="space-y-8 p-6">
      <OverlaySection
        projectId={projectId!}
        eventId={eventId!}
        workspaceId={workspaceId}
        userId={user.uid}
        overlays={event.draftConfig?.overlays || null}
      />

      <SharingSection event={event} projectId={projectId!} eventId={eventId!} />
    </div>
  )
}
