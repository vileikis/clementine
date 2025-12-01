import { listCompaniesAction } from "@/features/companies/actions";
import { CompanyCard } from "@/features/companies/components";

/**
 * Workspace root page - displays companies list
 * Users can navigate to any company via its slug
 */
export default async function WorkspacePage() {
  const result = await listCompaniesAction();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {result.error ?? "Failed to load companies"}
          </p>
        </div>
      </div>
    );
  }

  const companies = result.companies ?? [];

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No Companies
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first company to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Companies</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}
