"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { CompanyForm } from "@/features/companies/components/CompanyForm";
import type { Company } from "@/features/companies/types";

/**
 * Company settings page
 * Uses CompanyForm for editing company details including slug
 */
export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      const result = await getCompanyBySlugAction(companySlug);
      if (result.success && result.company) {
        setCompany(result.company);
      } else {
        setError(result.error ?? "Failed to load company");
      }
      setLoading(false);
    }
    loadCompany();
  }, [companySlug]);

  const handleSuccess = () => {
    // If slug changed, redirect to new slug URL
    if (company) {
      // Refresh to get updated company data
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error ?? "Company not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Company Settings</h1>
      <CompanyForm company={company} onSuccess={handleSuccess} />
    </div>
  );
}
