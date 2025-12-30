import type { AspectRatio, CameraFacingConfig } from '@/shared/camera/types'
import { Label } from '@/ui-kit/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/components/select'
import { Switch } from '@/ui-kit/components/switch'
import { Button } from '@/ui-kit/components/button'

export interface CameraPropConfig {
  enableLibrary: boolean
  cameraFacing: CameraFacingConfig
  initialFacing: 'user' | 'environment'
  aspectRatio: AspectRatio | 'none'
}

interface PropControlsProps {
  config: CameraPropConfig
  onConfigChange: (config: CameraPropConfig) => void
  onResetRemount: () => void
}

export function PropControls({
  config,
  onConfigChange,
  onResetRemount,
}: PropControlsProps) {
  const handleChange = <TKey extends keyof CameraPropConfig>(
    key: TKey,
    value: CameraPropConfig[TKey],
  ) => {
    onConfigChange({ ...config, [key]: value })
  }

  return (
    <div className="flex h-full flex-col space-y-6 border-r bg-muted/20 p-6">
      <div>
        <h2 className="text-lg font-semibold">Prop Controls</h2>
        <p className="text-sm text-muted-foreground">
          Configure camera component props
        </p>
      </div>

      <div className="flex-1 space-y-6">
        {/* Enable Library Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-library">Enable Library</Label>
            <Switch
              id="enable-library"
              checked={config.enableLibrary}
              onCheckedChange={(checked) =>
                handleChange('enableLibrary', checked)
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow photo upload from device library
          </p>
        </div>

        {/* Camera Facing Select */}
        <div className="space-y-2">
          <Label htmlFor="camera-facing">Camera Facing</Label>
          <Select
            value={config.cameraFacing}
            onValueChange={(value) =>
              handleChange('cameraFacing', value as CameraFacingConfig)
            }
          >
            <SelectTrigger id="camera-facing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Available camera options (user/environment/both)
          </p>
        </div>

        {/* Initial Facing Select */}
        <div className="space-y-2">
          <Label htmlFor="initial-facing">Initial Facing</Label>
          <Select
            value={config.initialFacing}
            onValueChange={(value) =>
              handleChange('initialFacing', value as 'user' | 'environment')
            }
          >
            <SelectTrigger id="initial-facing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Which camera to start with
          </p>
        </div>

        {/* Aspect Ratio Select */}
        <div className="space-y-2">
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select
            value={config.aspectRatio ?? 'none'}
            onValueChange={(value) =>
              handleChange(
                'aspectRatio',
                (value === 'none' ? 'none' : value) as AspectRatio | 'none',
              )
            }
          >
            <SelectTrigger id="aspect-ratio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Full Frame)</SelectItem>
              <SelectItem value="3:4">3:4 Portrait</SelectItem>
              <SelectItem value="1:1">1:1 Square</SelectItem>
              <SelectItem value="9:16">9:16 Stories</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Photo aspect ratio cropping
          </p>
        </div>
      </div>

      {/* Reset & Remount Button */}
      <div className="border-t pt-4">
        <Button
          onClick={onResetRemount}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Reset & Remount
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Force component remount with fresh state
        </p>
      </div>
    </div>
  )
}
