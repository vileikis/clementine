"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateCompanyDialog } from "./CreateCompanyDialog";

export function CompaniesHeader() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Companies</h1>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create
      </Button>
      <CreateCompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
