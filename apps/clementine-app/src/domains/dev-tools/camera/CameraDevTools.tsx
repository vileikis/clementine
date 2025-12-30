import { useState } from 'react'
import { CameraPropControls } from './CameraPropControls'
import { CallbackLog } from './CallbackLog'
import type { CameraPropConfig } from './CameraPropControls'
import type { CallbackEvent } from './CallbackLog'
import type { CameraCaptureError, CapturedPhoto } from '@/shared/camera/types'
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
    <div className="flex overflow-hidden">
      {/* Column 1: Prop Controls */}
      <div className="flex w-64 shrink-0 flex-col overflow-y-auto">
        <CameraPropControls
          config={config}
          onConfigChange={setConfig}
          onResetRemount={handleResetRemount}
        />
      </div>

      {/* Column 2: Camera Preview (Mobile Viewport) */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/10 p-4">
        <div className="flex flex-col items-center">
          <div className="mb-3">
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
      <div className="flex w-80 shrink-0 flex-col overflow-y-auto">
        <CallbackLog events={events} onClear={handleClearLog} />
      </div>
    </div>
  )
}
