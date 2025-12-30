import { useState } from 'react'
import { PropControls } from './PropControls'
import { CallbackLog } from './CallbackLog'
import type { CameraPropConfig } from './PropControls'
import type { CallbackEvent } from './CallbackLog'
import type {
  CameraCaptureError,
  CapturedPhoto,
} from '@/shared/camera/types'
import { CameraCapture } from '@/shared/camera'

const DEFAULT_CONFIG: CameraPropConfig = {
  enableLibrary: true,
  cameraFacing: 'both',
  initialFacing: 'user',
  aspectRatio: 'none',
}

export function CameraDevTools() {
  const [config, setConfig] = useState<CameraPropConfig>(DEFAULT_CONFIG)
  const [events, setEvents] = useState<CallbackEvent[]>([])
  const [mountKey, setMountKey] = useState(0)

  const addEvent = (
    type: CallbackEvent['type'],
    payload?: CallbackEvent['payload'],
  ) => {
    const event: CallbackEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      payload,
    }
    setEvents((prev) => [...prev, event])
  }

  const handleResetRemount = () => {
    setConfig(DEFAULT_CONFIG)
    setEvents([])
    setMountKey((prev) => prev + 1)
  }

  const handleClearLog = () => {
    setEvents([])
  }

  return (
    <div className="flex h-screen">
      {/* Column 1: Prop Controls */}
      <div className="w-80 flex-shrink-0">
        <PropControls
          config={config}
          onConfigChange={setConfig}
          onResetRemount={handleResetRemount}
        />
      </div>

      {/* Column 2: Camera Preview (Mobile Viewport) */}
      <div className="flex flex-1 items-center justify-center bg-muted/10 p-8">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Mobile Preview (375×667px)
            </h3>
          </div>
          <div
            className="overflow-hidden rounded-lg border-4 border-muted bg-background shadow-2xl"
            style={{ width: '375px', height: '667px' }}
          >
            <CameraCapture
              key={mountKey}
              enableLibrary={config.enableLibrary}
              cameraFacing={config.cameraFacing}
              initialFacing={config.initialFacing}
              aspectRatio={
                config.aspectRatio === 'none' ? undefined : config.aspectRatio
              }
              onPhoto={(photo: CapturedPhoto) => {
                addEvent('onPhoto', photo)
              }}
              onSubmit={(photo: CapturedPhoto) => {
                addEvent('onSubmit', photo)
              }}
              onError={(error: CameraCaptureError) => {
                addEvent('onError', error)
              }}
              onRetake={() => {
                addEvent('onRetake')
              }}
              onCancel={() => {
                addEvent('onCancel')
              }}
            />
          </div>
        </div>
      </div>

      {/* Column 3: Callback Log */}
      <div className="w-96 flex-shrink-0">
        <CallbackLog events={events} onClear={handleClearLog} />
      </div>
    </div>
  )
}
