"use server";

import { googleSignInConfigured, signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  if (!googleSignInConfigured()) redirect("/auth/error");
  await signIn("google", { redirectTo: "/" });
}

export async function signOutFromGoogle() {
  if (!googleSignInConfigured()) redirect("/auth/error");
  await signOut({ redirectTo: "/" });
}
