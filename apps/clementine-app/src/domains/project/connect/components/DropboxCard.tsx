/**
 * DropboxCard
 *
 * Project-level Dropbox export card. Shows export toggle when connected,
 * or directs users to Workspace Settings to connect/reconnect.
 *
 * All connection management (connect, disconnect, reconnect) lives in
 * Workspace Settings → Integrations.
 */
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import type { DropboxIntegration } from '@clementine/shared'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui-kit/ui/card'
import { Badge } from '@/ui-kit/ui/badge'
import { Switch } from '@/ui-kit/ui/switch'
import { Label } from '@/ui-kit/ui/label'

interface DropboxCardProps {
  workspaceSlug: string
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
  workspaceSlug,
  projectName,
  integration,
  isLoading,
  isExportEnabled,
  onToggleExport,
  isToggling,
}: DropboxCardProps) {
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

  // Not connected or needs re-auth — direct to workspace settings
  if (
    !integration ||
    integration.status === 'disconnected' ||
    integration.status === 'needs_reauth'
  ) {
    const isLost = integration?.status === 'needs_reauth'

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Dropbox</CardTitle>
            {isLost && <Badge variant="destructive">Connection Lost</Badge>}
          </div>
          <CardDescription>
            {isLost
              ? 'Dropbox connection lost — reconnect from Workspace Settings to resume exports.'
              : 'Automatically export AI-generated results to your Dropbox.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/workspace/$workspaceSlug/settings/integrations"
            params={{ workspaceSlug }}
            className="text-primary text-sm font-medium hover:underline"
          >
            {isLost
              ? 'Reconnect in Workspace Settings'
              : 'Connect in Workspace Settings'}
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Connected — export toggle + link to workspace settings
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
          <Label
            htmlFor="dropbox-export-toggle"
            className="text-sm font-medium"
          >
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
          <Link
            to="/workspace/$workspaceSlug/settings/integrations"
            params={{ workspaceSlug }}
            className="text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Manage in Workspace Settings
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
