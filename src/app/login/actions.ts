"use server";

import { redirect } from "next/navigation";

import { verifyAdminCredentials, getAdminAuthConfigIssue } from "@/lib/auth/credentials";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const configIssue = getAdminAuthConfigIssue();

  if (configIssue) {
    return {
      error: `${configIssue} Add it in Firebase App Hosting → Environment variables (Runtime), then redeploy.`,
    };
  }

  if (!verifyAdminCredentials(email, password)) {
    return { error: "Invalid email or password." };
  }

  try {
    const token = await createSessionToken(email.trim().toLowerCase());
    await setSessionCookie(token);
  } catch {
    return {
      error:
        "Could not create a session. Check AUTH_SECRET in App Hosting env vars and redeploy.",
    };
  }

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
