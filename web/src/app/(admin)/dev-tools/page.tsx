/**
 * Dev Tools Landing Page
 *
 * Redirects to the camera dev tools page.
 */

import { redirect } from "next/navigation";

export default function DevToolsPage() {
  redirect("/dev-tools/camera");
}
