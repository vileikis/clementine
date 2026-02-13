/**
 * Share Loading Config Panel Component
 *
 * Configuration panel for share screen loading state (shown during AI generation).
 * Allows admins to customize title and description text shown to guests.
 */
import type { ShareLoadingConfig } from '@clementine/shared'
import { Label } from '@/ui-kit/ui/label'
import { Textarea } from '@/ui-kit/ui/textarea'
import { Switch } from '@/ui-kit/ui/switch'

export interface ShareLoadingConfigPanelProps {
  shareLoading: ShareLoadingConfig
  onShareLoadingUpdate: (updates: Partial<ShareLoadingConfig>) => void
  disabled?: boolean
}

/**
 * Panel for configuring loading state content
 * Features title and description fields with help text
 */
export function ShareLoadingConfigPanel({
  shareLoading,
  onShareLoadingUpdate,
  disabled = false,
}: ShareLoadingConfigPanelProps) {
  const emailCapture = shareLoading.emailCapture ?? {
    enabled: false,
    heading: null,
  }

  return (
    <div className="space-y-6 p-4">
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="loading-title">Loading Title</Label>
        <Textarea
          id="loading-title"
          value={shareLoading.title ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onShareLoadingUpdate({ title: e.target.value || null })
          }
          placeholder="Creating your experience..."
          rows={2}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Shown to guests while AI generates their result
        </p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="loading-description">Loading Description</Label>
        <Textarea
          id="loading-description"
          value={shareLoading.description ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onShareLoadingUpdate({ description: e.target.value || null })
          }
          placeholder="This usually takes 30-60 seconds. Please wait..."
          rows={4}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Additional context about wait time or what's happening
        </p>
      </div>

      {/* Email Capture Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-capture-toggle">Get result by email</Label>
            <p className="text-xs text-muted-foreground">
              Let guests enter their email to receive the result
            </p>
          </div>
          <Switch
            id="email-capture-toggle"
            checked={emailCapture.enabled}
            onCheckedChange={(checked) =>
              onShareLoadingUpdate({
                emailCapture: { ...emailCapture, enabled: checked },
              })
            }
            disabled={disabled}
          />
        </div>

        {emailCapture.enabled && (
          <div className="space-y-2">
            <Label htmlFor="email-capture-heading">Email Form Heading</Label>
            <Textarea
              id="email-capture-heading"
              value={emailCapture.heading ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onShareLoadingUpdate({
                  emailCapture: {
                    ...emailCapture,
                    heading: e.target.value || null,
                  },
                })
              }
              placeholder="Get your result by email"
              rows={2}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  )
}
