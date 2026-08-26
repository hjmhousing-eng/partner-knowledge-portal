"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_BOX_USER_ID } from "../fixtures/demoLibrary";
import { READER_COOKIE } from "./readSessionReader";

export async function loginPartner(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const expectedEmail = process.env.DEMO_PARTNER_EMAIL ?? "partner@example.com";
  const expectedPassword = process.env.DEMO_PARTNER_PASSWORD ?? "partner";

  if (email !== expectedEmail || password !== expectedPassword) {
    redirect("/login?error=1");
  }

  const jar = await cookies();
  jar.set(READER_COOKIE, DEMO_BOX_USER_ID, {
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
