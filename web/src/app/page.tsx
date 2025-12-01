import { listCompaniesAction } from "@/features/companies/actions";
import { CompanyCard } from "@/features/companies/components";
import { AppNavbar } from "@/components/shared/AppNavbar";
import { LogoutButton } from "@/components/shared/LogoutButton";

/**
 * Root page - displays companies list
 * Users can navigate to any company via its slug
 */
export default async function Home() {
  const result = await listCompaniesAction();

  if (!result.success) {
    return (
      <div className="flex flex-col h-full">
        <AppNavbar
          breadcrumbs={[{ label: "\u{1F34A}", isLogo: true }]}
          actions={<LogoutButton />}
        />
        <div className="flex items-center justify-center flex-1 min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {result.error ?? "Failed to load companies"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const companies = result.companies ?? [];

  if (companies.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <AppNavbar
          breadcrumbs={[{ label: "\u{1F34A}", isLogo: true }]}
          actions={<LogoutButton />}
        />
        <div className="flex items-center justify-center flex-1 min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">
              No Companies
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first company to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[{ label: "\u{1F34A}", isLogo: true }]}
        actions={<LogoutButton />}
      />
      <div className="flex-1 overflow-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Companies</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </div>
    </div>
  );
}
