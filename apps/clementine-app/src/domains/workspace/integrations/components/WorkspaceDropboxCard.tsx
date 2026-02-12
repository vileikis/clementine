/**
 * WorkspaceDropboxCard
 *
 * Workspace-level Dropbox integration management card.
 * Shows connection status, disconnect button, and needs_reauth state with reconnect.
 * Does NOT include the export toggle (that's project-level in DropboxCard).
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DropboxIntegration } from '@clementine/shared'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui-kit/ui/card'
import { Button } from '@/ui-kit/ui/button'
import { Badge } from '@/ui-kit/ui/badge'
import {
  disconnectDropboxFn,
  initiateDropboxOAuthFn,
} from '@/domains/project/connect/server/functions'

interface WorkspaceDropboxCardProps {
  workspaceId: string
  workspaceSlug: string
  integration: DropboxIntegration | null
  isLoading: boolean
}

export function WorkspaceDropboxCard({
  workspaceId,
  workspaceSlug,
  integration,
  isLoading,
}: WorkspaceDropboxCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const queryClient = useQueryClient()
  const initiateOAuth = useServerFn(initiateDropboxOAuthFn)
  const disconnectDropbox = useServerFn(disconnectDropboxFn)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const result = await initiateOAuth({
        data: { workspaceId, projectId: '', workspaceSlug },
      })
      window.location.href = result.authorizationUrl
    } catch {
      toast.error('Failed to initiate Dropbox connection')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'This will disconnect Dropbox for all projects in this workspace. Continue?',
    )
    if (!confirmed) return

    setIsDisconnecting(true)
    try {
      await disconnectDropbox({ data: { workspaceId } })
      await queryClient.invalidateQueries({ queryKey: ['workspace'] })
      toast.success('Dropbox disconnected')
    } catch {
      toast.error('Failed to disconnect Dropbox')
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dropbox</CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Not connected
  if (!integration || integration.status === 'disconnected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dropbox</CardTitle>
          <CardDescription>
            Connect a Dropbox account to enable automatic export of AI-generated
            results across projects in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Dropbox'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Needs re-auth
  if (integration.status === 'needs_reauth') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Dropbox</CardTitle>
            <Badge variant="destructive">Connection Lost</Badge>
          </div>
          <CardDescription>
            Dropbox connection lost — reconnect to resume exports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              'Reconnect Dropbox'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Connected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Dropbox</CardTitle>
          <Badge variant="secondary">Connected</Badge>
        </div>
        <CardDescription>
          Connected as {integration.accountEmail}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-muted-foreground hover:text-destructive text-sm underline underline-offset-4 transition-colors"
        >
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </CardContent>
    </Card>
  )
}
