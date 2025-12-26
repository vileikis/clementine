import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useMatches,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import type { RouteArea } from '@/domains/navigation'
import { Sidebar } from '@/domains/navigation'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Clementine',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname || '/'

  // Determine route area from path
  const area: RouteArea = currentPath.startsWith('/admin')
    ? 'admin'
    : currentPath.startsWith('/workspace')
      ? 'workspace'
      : 'guest'

  // Extract workspaceId from path for workspace area
  const workspaceId =
    area === 'workspace'
      ? currentPath.split('/workspace/')[1]?.split('/')[0]
      : undefined

  return (
    <div className="flex min-h-screen bg-slate-900">
      <main className="flex-1">
        <Outlet />
      </main>
      <Sidebar area={area} workspaceId={workspaceId} />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
