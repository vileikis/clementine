// Project repository - CRUD operations for projects collection

import { db } from "@/lib/firebase/admin";
import type { Project } from "../types/project.types";
import { projectSchema } from "../schemas";
import { THEME_DEFAULTS } from "../constants";

export async function createProject(data: {
  name: string;
  companyId: string;
  primaryColor: string;
}): Promise<string> {
  const projectRef = db.collection("projects").doc();

  const now = Date.now();
  const projectId = projectRef.id;
  const sharePath = `/join/${projectId}`;

  const project: Project = {
    id: projectId,
    name: data.name,
    companyId: data.companyId,
    status: "draft",
    sharePath,
    qrPngPath: `projects/${projectId}/qr/share.png`,
    activeEventId: null,
    createdAt: now,
    updatedAt: now,
    // Initialize full theme structure with defaults
    theme: {
      ...THEME_DEFAULTS,
      primaryColor: data.primaryColor,
    },
  };

  await projectRef.set(project);

  return projectId;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const doc = await db.collection("projects").doc(projectId).get();
  if (!doc.exists) return null;
  return projectSchema.parse({ id: doc.id, ...doc.data() });
}

export async function getProjectBySharePath(sharePath: string): Promise<Project | null> {
  const snapshot = await db.collection("projects")
    .where("sharePath", "==", sharePath)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return projectSchema.parse({ id: doc.id, ...doc.data() });
}

export async function listProjects(filters?: {
  companyId?: string | null;
}): Promise<Project[]> {
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("projects");

  // Filter out deleted projects - use "in" clause for Firestore compatibility
  query = query.where("status", "in", ["draft", "live", "archived"]);

  // Special handling for "no company" filter
  // Need to fetch all projects and filter server-side because Firestore
  // doesn't match undefined fields with null queries
  if (filters?.companyId === null) {
    const snapshot = await query.orderBy("updatedAt", "desc").get();
    const allProjects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];

    // Filter for projects without companyId (null or undefined)
    const projectsWithoutCompany = allProjects.filter(
      (project) =>
        project.companyId === null ||
        project.companyId === undefined ||
        project.companyId === ""
    );

    return projectsWithoutCompany.map((project) => projectSchema.parse(project));
  }

  // Apply companyId filter for specific company
  if (filters?.companyId !== undefined) {
    query = query.where("companyId", "==", filters.companyId);
  }

  const snapshot = await query.orderBy("updatedAt", "desc").get();
  return snapshot.docs.map((doc) =>
    projectSchema.parse({ id: doc.id, ...doc.data() })
  );
}

export async function updateProjectBranding(
  projectId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
): Promise<void> {
  await db.collection("projects").doc(projectId).update({
    ...branding,
    updatedAt: Date.now(),
  });
}

export async function updateProjectStatus(
  projectId: string,
  status: "draft" | "live" | "archived"
): Promise<void> {
  await db.collection("projects").doc(projectId).update({
    status,
    updatedAt: Date.now(),
  });
}

export async function updateProjectName(
  projectId: string,
  name: string
): Promise<void> {
  await db.collection("projects").doc(projectId).update({
    name,
    updatedAt: Date.now(),
  });
}

/**
 * Soft delete a project (mark as deleted)
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = db.collection("projects").doc(projectId);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new Error("Project not found");
  }

  const now = Date.now();
  await projectRef.update({
    status: "deleted",
    deletedAt: now,
    updatedAt: now,
  });
}
