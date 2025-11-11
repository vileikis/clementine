"use client";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="min-h-[44px]"
    >
      Log out
    </Button>
  );
}
