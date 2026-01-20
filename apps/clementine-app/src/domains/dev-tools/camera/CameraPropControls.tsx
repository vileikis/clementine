import type { AspectRatio, CameraFacingConfig } from '@/shared/camera/types'
import { Label } from '@/ui-kit/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'
import { Switch } from '@/ui-kit/ui/switch'
import { Button } from '@/ui-kit/ui/button'

export interface CameraPropConfig {
  enableLibrary: boolean
  cameraFacing: CameraFacingConfig
  initialFacing: 'user' | 'environment'
  aspectRatio: AspectRatio | 'none'
}

interface CameraPropControlsProps {
  config: CameraPropConfig
  onConfigChange: (config: CameraPropConfig) => void
  onResetRemount: () => void
}

/**
 * Camera Prop Controls Component
 *
 * Inline controls for configuring camera component props
 * Matches PreviewShellControls pattern with horizontal layout
 */
export function CameraPropControls({
  config,
  onConfigChange,
  onResetRemount,
}: CameraPropControlsProps) {
  const handleChange = <TKey extends keyof CameraPropConfig>(
    key: TKey,
    value: CameraPropConfig[TKey],
  ) => {
    onConfigChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-3 border-b bg-muted/20 p-4">
      {/* Enable Library Toggle */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="enable-library" className="text-sm">
          Enable Library
        </Label>
        <Switch
          id="enable-library"
          checked={config.enableLibrary}
          onCheckedChange={(checked) => handleChange('enableLibrary', checked)}
        />
      </div>

      {/* Camera Facing Select */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="camera-facing" className="text-sm">
          Camera Facing
        </Label>
        <Select
          value={config.cameraFacing}
          onValueChange={(value) =>
            handleChange('cameraFacing', value as CameraFacingConfig)
          }
        >
          <SelectTrigger id="camera-facing" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="environment">Environment</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Initial Facing Select */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="initial-facing" className="text-sm">
          Initial Facing
        </Label>
        <Select
          value={config.initialFacing}
          onValueChange={(value) =>
            handleChange('initialFacing', value as 'user' | 'environment')
          }
        >
          <SelectTrigger id="initial-facing" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="environment">Environment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio Select */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="aspect-ratio" className="text-sm">
          Aspect Ratio
        </Label>
        <Select
          value={config.aspectRatio ?? 'none'}
          onValueChange={(value) =>
            handleChange(
              'aspectRatio',
              (value === 'none' ? 'none' : value) as AspectRatio | 'none',
            )
          }
        >
          <SelectTrigger id="aspect-ratio" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="1:1">1:1 Square</SelectItem>
            <SelectItem value="9:16">9:16 Stories</SelectItem>
            <SelectItem value="3:2">3:2 Landscape</SelectItem>
            <SelectItem value="2:3">2:3 Portrait</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset & Remount Button */}
      <div className="border-t pt-3">
        <Button
          onClick={onResetRemount}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Reset & Remount
        </Button>
      </div>
    </div>
  )
}
