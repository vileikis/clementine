import type { CameraCaptureError, CapturedPhoto } from '@/shared/camera/types'
import { Button } from '@/ui-kit/components/button'
import { ScrollArea } from '@/ui-kit/components/scroll-area'

export interface CallbackEvent {
  id: string
  timestamp: number
  type: 'onPhoto' | 'onSubmit' | 'onRetake' | 'onCancel' | 'onError'
  payload?: CapturedPhoto | CameraCaptureError | undefined
}

interface CallbackLogProps {
  events: CallbackEvent[]
  onClear: () => void
}

export function CallbackLog({ events, onClear }: CallbackLogProps) {
  return (
    <div className="flex h-full flex-col border-l bg-muted/20 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Callback Log</h2>
          <p className="text-sm text-muted-foreground">
            Event callbacks in real-time
          </p>
        </div>
        <Button onClick={onClear} variant="outline" size="sm">
          Clear
        </Button>
      </div>

      <ScrollArea className="mt-4 flex-1">
        <div className="space-y-3 pr-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events yet. Interact with the camera to see callbacks.
            </p>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => <EventEntry key={event.id} event={event} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function EventEntry({ event }: { event: CallbackEvent }) {
  const timestamp = formatTimestamp(event.timestamp)
  const payload = formatPayload(event.type, event.payload)

  return (
    <div className="rounded-lg border bg-card p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-primary">
          {event.type}
        </span>
        <span className="font-mono text-muted-foreground">{timestamp}</span>
      </div>
      {payload && (
        <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs">
          {payload}
        </pre>
      )}
    </div>
  )
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

function formatPayload(
  type: CallbackEvent['type'],
  payload: CallbackEvent['payload'],
): string | null {
  if (payload === undefined) {
    return 'undefined'
  }

  if (payload === null) {
    return 'null'
  }

  // onPhoto or onSubmit - CapturedPhoto
  if (type === 'onPhoto' || type === 'onSubmit') {
    const photo = payload as CapturedPhoto
    return JSON.stringify(
      {
        method: photo.method,
        dimensions: `${photo.width}×${photo.height}`,
        fileName: photo.file.name,
        fileSize: `${(photo.file.size / 1024).toFixed(2)} KB`,
        fileType: photo.file.type,
      },
      null,
      2,
    )
  }

  // onError - CameraCaptureError
  if (type === 'onError') {
    const error = payload as CameraCaptureError
    return JSON.stringify(
      {
        code: error.code,
        message: error.message,
      },
      null,
      2,
    )
  }

  // onRetake, onCancel - typically no payload
  return null
}
