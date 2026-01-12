/**
 * ProfileSelector Component
 *
 * Radio button selector for choosing an experience profile type.
 * Displays profile name and description for each option.
 */
import type { ExperienceProfile } from '@/domains/experience/shared'
import { profileMetadata } from '@/domains/experience/shared'
import { Label } from '@/ui-kit/ui/label'
import { cn } from '@/shared/utils/style-utils'

/**
 * Profile options
 */
const profileOptions: ExperienceProfile[] = ['freeform', 'survey', 'story']

interface ProfileSelectorProps {
  /** Currently selected profile */
  value: ExperienceProfile
  /** Callback when profile selection changes */
  onChange: (profile: ExperienceProfile) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Error message to display */
  error?: string
}

/**
 * Profile selector component with radio buttons
 *
 * @example
 * ```tsx
 * <ProfileSelector
 *   value={selectedProfile}
 *   onChange={setSelectedProfile}
 * />
 * ```
 */
export function ProfileSelector({
  value,
  onChange,
  disabled,
  error,
}: ProfileSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Profile Type</Label>
      <div className="space-y-2">
        {profileOptions.map((profile) => {
          const meta = profileMetadata[profile]
          const isSelected = value === profile

          return (
            <label
              key={profile}
              className={cn(
                'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                isSelected && 'border-2 border-primary bg-muted/50',
                !isSelected && 'border-border hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <input
                type="radio"
                name="profile"
                value={profile}
                checked={isSelected}
                onChange={() => onChange(profile)}
                disabled={disabled}
                className="mt-1 h-4 w-4"
              />
              <div>
                <span className="font-medium">{meta.label}</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {meta.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
