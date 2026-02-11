/**
 * DropboxCard
 *
 * Integration card for Dropbox connection and export toggle.
 * Renders different UI states: not connected, connected (export off/on),
 * needs re-auth, and loading.
 */
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui-kit/ui/card'
import { Button } from '@/ui-kit/ui/button'
import { Badge } from '@/ui-kit/ui/badge'
import { Switch } from '@/ui-kit/ui/switch'
import { Label } from '@/ui-kit/ui/label'
import type { DropboxIntegration } from '@clementine/shared'
import {
  initiateDropboxOAuthFn,
  disconnectDropboxFn,
} from '../server/functions'

interface DropboxCardProps {
  workspaceId: string
  workspaceSlug: string
  projectId: string
  projectName: string
  integration: DropboxIntegration | null
  isLoading: boolean
  /** Whether Dropbox export is enabled for this project */
  isExportEnabled: boolean
  /** Toggle export on/off */
  onToggleExport: () => void
  /** Whether a toggle mutation is in progress */
  isToggling: boolean
}

export function DropboxCard({
  workspaceId,
  workspaceSlug,
  projectId,
  projectName,
  integration,
  isLoading,
  isExportEnabled,
  onToggleExport,
  isToggling,
}: DropboxCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const initiateOAuth = useServerFn(initiateDropboxOAuthFn)
  const disconnectDropbox = useServerFn(disconnectDropboxFn)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const result = await initiateOAuth({
        data: { workspaceId, projectId, workspaceSlug },
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

  // State A: Not connected
  if (!integration || integration.status === 'disconnected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dropbox</CardTitle>
          <CardDescription>
            Automatically export AI-generated results to your Dropbox.
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

  // State: Needs re-auth
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

  // State B/C: Connected
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
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dropbox-export-toggle" className="text-sm font-medium">
            Export results to Dropbox
          </Label>
          <Switch
            id="dropbox-export-toggle"
            checked={isExportEnabled}
            onCheckedChange={onToggleExport}
            disabled={isToggling}
          />
        </div>
        {isExportEnabled && (
          <div className="text-muted-foreground text-sm">
            Results will be exported to{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              /Apps/Clementine/{projectName}/
            </code>
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-muted-foreground hover:text-destructive text-sm underline underline-offset-4 transition-colors"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
