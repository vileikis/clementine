'use client'

import { useState } from 'react'
import { PropControlsPanel } from './components/PropControlsPanel'
import { PreviewArea } from './components/PreviewArea'
import type { ViewportMode } from '@/shared/preview-shell'

interface ComponentConfig {
  enableViewportSwitcher: boolean
  enableFullscreen: boolean
  defaultViewport: ViewportMode
}

/**
 * Dev-Tools Preview Shell Container
 *
 * Main container component for the preview-shell testing interface
 * Manages configuration state and remount functionality
 */
export function DevToolsPreviewShell() {
  const [config, setConfig] = useState<ComponentConfig>({
    enableViewportSwitcher: true,
    enableFullscreen: true,
    defaultViewport: 'mobile',
  })
  const [remountKey, setRemountKey] = useState(0)

  const handleReset = () => {
    setConfig({
      enableViewportSwitcher: true,
      enableFullscreen: true,
      defaultViewport: 'mobile',
    })
    setRemountKey((k) => k + 1)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold">Preview Shell</h1>
        <p className="text-sm text-muted-foreground">
          Device preview testing interface
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden gap-2">
        {/* Left: Prop Controls (25%) */}
        <PropControlsPanel
          config={config}
          onConfigChange={setConfig}
          onReset={handleReset}
        />

        {/* Right: Preview Area (75%) */}
        <PreviewArea key={remountKey} config={config} />
      </div>
    </div>
  )
}
