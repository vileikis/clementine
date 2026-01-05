import { useParams } from '@tanstack/react-router'
import { SharingSection } from '../components/SharingSection'
import { useProjectEvent } from '@/domains/event/shared/hooks/useProjectEvent'

export function SettingsSharingPage() {
  const { projectId, eventId } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId!, eventId!)

  if (!event) return null

  return (
    <div className="p-6">
      <SharingSection event={event} projectId={projectId!} eventId={eventId!} />

      {/* Future sections */}
      {/* <OverlaysSection event={event} projectId={projectId!} eventId={eventId!} /> */}
    </div>
  )
}
