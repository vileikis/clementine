// Example: Nested route data sharing patterns
// This is just an example - not meant to be run

import { createFileRoute } from '@tanstack/react-router'

// ============================================
// OPTION 1: Access Parent Loaders Directly
// ============================================

// Parent route: /companies/$companyId
export const CompanyRoute = createFileRoute('/companies/$companyId')({
  loader: async ({ params }) => {
    const company = await getCompanyById({ data: params.companyId })
    return { company }
  },
})

// Child route: /companies/$companyId/p/$projectId
export const ProjectRoute = createFileRoute(
  '/companies/$companyId/p/$projectId',
)({
  loader: async ({ params }) => {
    // You have access to BOTH companyId and projectId
    console.log('Parent ID:', params.companyId)
    console.log('Current ID:', params.projectId)

    const project = await getProjectById({ data: params.projectId })
    return { project }
  },

  component: () => {
    const { project } = ProjectRoute.useLoaderData()

    // Access parent route data using useMatch
    const companyMatch = ProjectRoute.useMatch({
      from: '/companies/$companyId',
    })
    const { company } = companyMatch.loaderData

    return (
      <div>
        <h1>{company.name}</h1>
        <h2>{project.name}</h2>
      </div>
    )
  },
})

// ============================================
// OPTION 2: TanStack Query (RECOMMENDED)
// ============================================

// Server functions with stable cache keys
import { createServerFn } from '@tanstack/react-start'
import { queryOptions, useQuery } from '@tanstack/react-query'

export const getCompanyById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // Fetch company
    return { id, name: 'Company Name' }
  })

// Create query options for stable caching
export const companyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['company', companyId],
    queryFn: () => getCompanyById({ data: companyId }),
  })

export const projectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById({ data: projectId }),
  })

// Parent route
export const CompanyRouteV2 = createFileRoute('/companies/$companyId')({
  loader: async ({ params, context }) => {
    // Prefetch and cache company data
    await context.queryClient.ensureQueryData(
      companyQueryOptions(params.companyId),
    )
  },
})

// Child route
export const ProjectRouteV2 = createFileRoute(
  '/companies/$companyId/p/$projectId',
)({
  loader: async ({ params, context }) => {
    // Both queries will use cache if available
    await Promise.all([
      context.queryClient.ensureQueryData(
        companyQueryOptions(params.companyId),
      ),
      context.queryClient.ensureQueryData(
        projectQueryOptions(params.projectId),
      ),
    ])
  },

  component: () => {
    const { companyId, projectId } = ProjectRouteV2.useParams()

    // Both queries read from cache - no refetch!
    const { data: company } = useQuery(companyQueryOptions(companyId))
    const { data: project } = useQuery(projectQueryOptions(projectId))

    return (
      <div>
        <h1>{company?.name}</h1>
        <h2>{project?.name}</h2>
      </div>
    )
  },
})

// ============================================
// OPTION 3: Route Context (Less Common)
// ============================================

// This is different from Router Context!
// Route context is for passing data to child routes

export const CompanyLayoutRoute = createFileRoute('/companies/$companyId')({
  loader: async ({ params }) => {
    const company = await getCompanyById({ data: params.companyId })
    return { company }
  },

  // beforeLoad runs before child loaders
  beforeLoad: async ({ params }) => {
    const company = await getCompanyById({ data: params.companyId })

    // Return as route context - available to all child routes
    return {
      company,
    }
  },
})

// Child can access via context parameter
export const ProjectRouteV3 = createFileRoute(
  '/companies/$companyId/p/$projectId',
)({
  loader: async ({ params, context }) => {
    // company is available from parent's beforeLoad
    console.log('Company from parent:', context.company)

    const project = await getProjectById({ data: params.projectId })
    return { project }
  },
})
