"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { z } from "zod";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

/**
 * Login action - validates password and sets ADMIN_SECRET cookie
 */
export async function loginAction(input: unknown) {
  try {
    const validated = loginSchema.parse(input);

    // Verify password matches ADMIN_SECRET
    if (validated.password !== process.env.ADMIN_SECRET) {
      return { success: false, error: "Invalid password" };
    }

    // Set HTTP-only cookie with SameSite and Secure flags
    const cookieStore = await cookies();
    cookieStore.set("ADMIN_SECRET", validated.password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Logout action - clears ADMIN_SECRET cookie and redirects to login
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("ADMIN_SECRET");
  redirect(PUBLIC_ROUTES.LOGIN);
}
