import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState } from 'react'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '@/ui-kit/theme/styles.css?url'
import { AuthProvider, useAuth } from '@/domains/auth/providers/AuthProvider'
import { Toaster } from '@/ui-kit/ui/sonner'
import { TooltipProvider } from '@/ui-kit/ui/tooltip'

export interface MyRouterContext {
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
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const [authKey, setAuthKey] = useState(0)

  return (
    <TooltipProvider>
      <AuthProvider key={authKey}>
        <RootLayout onRetry={() => setAuthKey((k) => k + 1)} />
      </AuthProvider>
    </TooltipProvider>
  )
}

function RootLayout({ onRetry }: { onRetry: () => void }) {
  const auth = useAuth()

  // Auth timed out — show retry UI
  if (auth.hasTimedOut) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          Authentication took too long. Please try again.
        </p>
        <button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    )
  }

  // Wait for auth to initialize before rendering routes
  if (auth.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Initializing authentication...
      </div>
    )
  }

  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
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
