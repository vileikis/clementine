"use client";

import { useState, useEffect } from "react";
import { listCompaniesAction } from "@/lib/actions/companies";
import { CompanyCard } from "@/components/organizer/CompanyCard";
import { CompanyForm } from "@/components/organizer/CompanyForm";
import type { Company } from "@/lib/types/firestore";
import { Button } from "@/components/ui/button";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);

    const result = await listCompaniesAction();

    if (result.success) {
      setCompanies(result.companies ?? []);
    } else {
      setError(result.error || "Failed to load companies");
    }

    setLoading(false);
  };

  // Fetch companies on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCompanies();
  }, []);

  const handleCreateSuccess = () => {
    // Reload companies and close form
    loadCompanies();
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load companies: {error}</p>
        <Button onClick={loadCompanies} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Companies</h2>
          <p className="text-muted-foreground mt-1">
            Organize events by brand or client
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Company"}
        </Button>
      </div>

      {/* Company Creation Form */}
      {showForm && (
        <div className="border rounded-lg p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-4">Create New Company</h3>
          <CompanyForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Companies List */}
      {companies.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first company to organize events
          </p>
          <Button onClick={() => setShowForm(true)}>
            Create Your First Company
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
