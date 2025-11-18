"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company } from "../types/company.types";

interface CompanyFilterProps {
  companies: Company[];
}

export function CompanyFilter({ companies }: CompanyFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCompanyId = searchParams.get("companyId");

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      // Remove companyId filter
      params.delete("companyId");
    } else {
      // Set companyId filter
      params.set("companyId", value);
    }

    // Navigate to updated URL
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  // Determine current selection from URL param
  // If no companyId param, show "all", otherwise use the param value
  const currentValue = currentCompanyId || "all";

  return (
    <div className="w-full md:w-auto">
      <Select value={currentValue} onValueChange={handleFilterChange}>
        <SelectTrigger className="min-h-[44px] w-full md:w-[240px]">
          <SelectValue placeholder="Filter by company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          <SelectItem value="no-company">No Company</SelectItem>
          {companies.length > 0 && (
            <>
              <div className="border-t my-1" />
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
