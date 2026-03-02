/**
 * ExperienceTopBar Component
 *
 * Props-driven top navigation bar for experience pages.
 * Used by ExperienceRuntime (full runtime state) and SharePage (title + close only).
 *
 * @example
 * ```tsx
 * // Runtime usage - full controls
 * <ExperienceTopBar
 *   title="My Experience"
 *   surface="auto"
 *   progress={{ current: 2, total: 5 }}
 *   onBack={() => store.back()}
 *   onClose={() => navigate('/home')}
 * />
 *
 * // SharePage usage - title + close only
 * <ExperienceTopBar title="Your Result" onClose={() => navigate('/home')} />
 * ```
 */

import { useState } from 'react'
import { ArrowLeft, Home, X } from 'lucide-react'

import type { Surface } from '@/shared/theming'
import {
  ThemedButton,
  ThemedIconButton,
  ThemedProgressBar,
  ThemedText,
  useThemeWithOverride,
} from '@/shared/theming'
import { cn } from '@/shared/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/ui/alert-dialog'

export interface ExperienceTopBarProps {
  /** Experience name displayed in center */
  title?: string
  /** Rendering surface context forwarded to themed children */
  surface?: Surface
  /** When provided, shows progress bar. Omit to hide. */
  progress?: { current: number; total: number }
  /** When provided, shows back button (ArrowLeft). Omit to hide. */
  onBack?: () => void
  /** When provided, enables close (X) and home buttons with exit confirmation. Omit to disable. */
  onClose?: () => void
  /** Additional CSS classes for topbar container */
  className?: string
}

export function ExperienceTopBar({
  title,
  surface = 'auto',
  progress,
  onBack,
  onClose,
  className,
}: ExperienceTopBarProps) {
  const theme = useThemeWithOverride()
  const [showDialog, setShowDialog] = useState(false)

  // Left button: back arrow if onBack provided, otherwise close X if onClose provided
  const showBackButton = !!onBack
  const showCloseButton = !onBack && !!onClose

  // Progress bar visibility
  const showProgress = progress && progress.total > 1
  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0

  const handleBackClick = () => {
    if (showBackButton) {
      onBack?.()
    } else if (showCloseButton) {
      setShowDialog(true)
    }
  }

  const handleHomeClick = () => {
    if (onClose) {
      setShowDialog(true)
    }
  }

  const handleConfirmExit = () => {
    setShowDialog(false)
    onClose?.()
  }

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'flex justify-center',
          'px-4 pt-3 pb-8',
          className,
        )}
      >
        {/* Blurred background with gradient fade */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        />

        {/* Inner container with max width */}
        <div className="relative w-full max-w-2xl flex items-center gap-4">
          {/* Left: Back or Close button */}
          {(showBackButton || showCloseButton) && (
            <ThemedIconButton
              size="md"
              variant="outline"
              surface={surface}
              onClick={handleBackClick}
              aria-label={showBackButton ? 'Go back' : 'Close'}
              className="shrink-0"
            >
              {showBackButton ? (
                <ArrowLeft className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </ThemedIconButton>
          )}

          {/* Center: Title and progress bar */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            {title && (
              <ThemedText
                variant="heading"
                as="h3"
                surface={surface}
                className="max-w-[200px] truncate text-xl"
              >
                {title}
              </ThemedText>
            )}

            {showProgress && (
              <ThemedProgressBar
                className="w-full max-w-[200px]"
                surface={surface}
                value={progressPercentage}
                getValueLabel={(value) =>
                  `Step ${progress.current} of ${progress.total} (${Math.round(value)}% complete)`
                }
              />
            )}
          </div>

          {/* Right: Home button */}
          <ThemedIconButton
            size="md"
            variant="outline"
            surface={surface}
            onClick={handleHomeClick}
            disabled={!onClose}
            aria-label="Return to home"
            className="shrink-0"
          >
            <Home className="h-5 w-5" />
          </ThemedIconButton>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent
          className="max-w-sm sm:max-w-sm text-center"
          style={{
            backgroundColor: theme.background.color,
          }}
        >
          <AlertDialogHeader className="items-center">
            <AlertDialogTitle style={{ color: theme.text.color }}>
              Exit Experience?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: theme.text.color }}
              className="text-center"
            >
              Your progress will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center sm:justify-center">
            <ThemedButton
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </ThemedButton>
            <ThemedButton
              variant="primary"
              size="sm"
              onClick={handleConfirmExit}
            >
              Exit
            </ThemedButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
