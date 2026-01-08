'use client'

import type { ViewportMode } from '@/shared/preview-shell'
import type { ComponentConfig } from '../types'
import { Button } from '@/ui-kit/ui/button'
import { Label } from '@/ui-kit/ui/label'
import { Switch } from '@/ui-kit/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

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
    <div className="flex w-1/4 flex-col bg-muted/30 p-6">
      <div className="space-y-4">
        {/* Enable Viewport Switcher */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor="enable-viewport-switcher"
            className="text-sm font-medium"
          >
            Viewport Switcher
          </Label>
          <Switch
            id="enable-viewport-switcher"
            checked={config.enableViewportSwitcher}
            onCheckedChange={(checked: boolean) =>
              handleChange('enableViewportSwitcher', checked)
            }
          />
        </div>

        {/* Enable Fullscreen */}
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-fullscreen" className="text-sm font-medium">
            Fullscreen Mode
          </Label>
          <Switch
            id="enable-fullscreen"
            checked={config.enableFullscreen}
            onCheckedChange={(checked: boolean) =>
              handleChange('enableFullscreen', checked)
            }
          />
        </div>

        {/* Default Viewport */}
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="default-viewport" className="text-sm font-medium">
            Default Viewport
          </Label>
          <Select
            value={config.defaultViewport}
            onValueChange={(value: string) =>
              handleChange('defaultViewport', value as ViewportMode)
            }
          >
            <SelectTrigger id="default-viewport" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
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
