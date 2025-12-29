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
    <div className="flex h-screen">
      {/* Left: Prop Controls (25%) */}
      <PropControlsPanel
        config={config}
        onConfigChange={setConfig}
        onReset={handleReset}
      />

      {/* Right: Preview Area (75%) */}
      <PreviewArea key={remountKey} config={config} />
    </div>
  )
}
