import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      // Log query errors in development for better debugging
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.error('🔴 TanStack Query Error:', error)
        }
      },
    }),
    mutationCache: new MutationCache({
      // Log mutation errors in development
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.error('🔴 TanStack Query Mutation Error:', error)
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Don't throw errors to error boundary by default
        throwOnError: false,
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
