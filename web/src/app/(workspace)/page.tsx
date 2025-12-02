import { redirect } from "next/navigation";

/**
 * Workspace root page - redirects to /companies
 */
export default function WorkspacePage() {
  redirect("/companies");
}
