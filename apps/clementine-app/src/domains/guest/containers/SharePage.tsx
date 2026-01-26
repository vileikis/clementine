/**
 * SharePage Container
 *
 * Placeholder share screen that displays after main experience completion.
 * Will show transform processing state and final result once transform is complete.
 *
 * This is a placeholder for E8 (Share Screen) implementation.
 *
 * User Story: US1 - Guest Executes Main Experience
 */
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Clock } from 'lucide-react'

import { useGuestContext } from '../contexts'

export interface SharePageProps {
  /** Main session ID from URL query params */
  mainSessionId: string
}

/**
 * Share page placeholder
 *
 * Displays a placeholder message indicating the share screen is coming.
 * In E8, this will:
 * - Subscribe to main session for jobStatus updates
 * - Display processing state while transform is running
 * - Show final result media when transform completes
 * - Provide sharing options (download, social share)
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/share.tsx
 * function JoinSharePage() {
 *   const { session } = Route.useSearch()
 *   return <SharePage mainSessionId={session} />
 * }
 * ```
 */
export function SharePage({ mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Processing Your Creation
        </h1>

        <p className="mt-4 text-muted-foreground">
          Your experience is complete! The AI is now transforming your content.
          The full share screen with results will be available in Epic E8.
        </p>

        {/* Session info for debugging/verification */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left text-sm">
          <p className="font-medium text-foreground">Session Details</p>
          <p className="mt-2 text-muted-foreground">
            <span className="font-mono text-xs break-all">{mainSessionId}</span>
          </p>
        </div>

        {/* Back to welcome link */}
        <Link
          to="/join/$projectId"
          params={{ projectId: project.id }}
          className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to welcome screen
        </Link>
      </div>
    </div>
  )
}
