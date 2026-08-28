"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateDemoReviewer } from "./demoReviewers";
import { loadDemoReviewers } from "./loadDemoReviewers";
import { READER_COOKIE } from "./readSessionReader";

export async function loginPartner(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const reviewer = authenticateDemoReviewer(
    email,
    password,
    loadDemoReviewers(),
  );

  if (!reviewer) {
    redirect("/login?error=1");
  }

  const jar = await cookies();
  jar.set(READER_COOKIE, reviewer.boxUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/products/sku-a/battlecard");
}

export async function logoutPartner() {
  const jar = await cookies();
  jar.delete(READER_COOKIE);
  redirect("/");
}
