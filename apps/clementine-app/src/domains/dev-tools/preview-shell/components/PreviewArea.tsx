'use client'

import type { ViewportMode } from '@/shared/preview-shell'
import { PreviewShell } from '@/shared/preview-shell'
import { Button } from '@/ui-kit/components/button'

interface ComponentConfig {
  enableViewportSwitcher: boolean
  enableFullscreen: boolean
  defaultViewport: ViewportMode
}

interface PreviewAreaProps {
  config: ComponentConfig
}

/**
 * Preview Area Component
 *
 * Right column of dev-tools interface (~75% width)
 * Displays PreviewShell with rich sample content for visual testing
 */
export function PreviewArea({ config }: PreviewAreaProps) {
  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background ">
      <PreviewShell
        enableViewportSwitcher={config.enableViewportSwitcher}
        enableFullscreen={config.enableFullscreen}
      >
        {/* Rich Sample Content */}
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="border-b pb-4">
            <h1 className="text-3xl font-bold">Preview Shell Demo</h1>
            <p className="mt-2 text-muted-foreground">
              Testing device preview infrastructure with viewport switching and
              fullscreen mode
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Viewport Simulation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This content adapts to mobile (375×667px) or desktop (900×600px)
                viewports. Use the viewport switcher above to toggle between
                modes.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="font-medium">Sample Card</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button>Primary Action</Button>
              <Button variant="outline">Secondary</Button>
              <Button variant="ghost">Tertiary</Button>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="font-medium">Fullscreen Mode</h3>
              <p className="text-sm text-muted-foreground">
                Click the fullscreen trigger button (maximize icon) to enter
                fullscreen overlay mode. Press Escape or click the X button to
                exit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-primary">375px</div>
                <div className="text-xs text-muted-foreground">
                  Mobile Width
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-primary">667px</div>
                <div className="text-xs text-muted-foreground">
                  Mobile Height
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewShell>
    </div>
  )
}
