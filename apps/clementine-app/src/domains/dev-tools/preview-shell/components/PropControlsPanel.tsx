'use client'

import type { ViewportMode } from '@/shared/preview-shell'
import { Button } from '@/ui-kit/components/button'
import { Label } from '@/ui-kit/components/label'
import { Switch } from '@/ui-kit/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/components/ui/select'

interface ComponentConfig {
  enableViewportSwitcher: boolean
  enableFullscreen: boolean
  defaultViewport: ViewportMode
}

interface PropControlsPanelProps {
  config: ComponentConfig
  onConfigChange: (config: ComponentConfig) => void
  onReset: () => void
}

/**
 * Prop Controls Panel Component
 *
 * Left column of dev-tools interface (~25% width)
 * Contains interactive controls for configuring PreviewShell props
 */
export function PropControlsPanel({
  config,
  onConfigChange,
  onReset,
}: PropControlsPanelProps) {
  const handleChange = (
    key: keyof ComponentConfig,
    value: boolean | ViewportMode,
  ) => {
    onConfigChange({ ...config, [key]: value })
  }

  return (
    <div className="flex w-1/4 flex-col border-r bg-muted/30 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Preview Shell</h1>
        <p className="text-sm text-muted-foreground">
          Dev-tools testing interface
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable Viewport Switcher */}
        <div className="space-y-2">
          <Label
            htmlFor="enable-viewport-switcher"
            className="text-sm font-medium"
          >
            Viewport Switcher
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-viewport-switcher"
              checked={config.enableViewportSwitcher}
              onCheckedChange={(checked: boolean) =>
                handleChange('enableViewportSwitcher', checked)
              }
            />
            <span className="text-sm text-muted-foreground">
              {config.enableViewportSwitcher ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Enable Fullscreen */}
        <div className="space-y-2">
          <Label htmlFor="enable-fullscreen" className="text-sm font-medium">
            Fullscreen Mode
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-fullscreen"
              checked={config.enableFullscreen}
              onCheckedChange={(checked: boolean) =>
                handleChange('enableFullscreen', checked)
              }
            />
            <span className="text-sm text-muted-foreground">
              {config.enableFullscreen ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Default Viewport */}
        <div className="space-y-2">
          <Label htmlFor="default-viewport" className="text-sm font-medium">
            Default Viewport
          </Label>
          <Select
            value={config.defaultViewport}
            onValueChange={(value: string) =>
              handleChange('defaultViewport', value as ViewportMode)
            }
          >
            <SelectTrigger id="default-viewport">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Mobile (375×667)</SelectItem>
              <SelectItem value="desktop">Desktop (900×600)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <div className="pt-4">
          <Button onClick={onReset} variant="outline" className="w-full">
            Reset & Remount
          </Button>
        </div>
      </div>
    </div>
  )
}
