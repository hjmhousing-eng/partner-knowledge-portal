import { Suspense } from "react";
import Link from "next/link";
import { logoutPartner } from "@/lib/session/actions";
import { readSessionReader } from "@/lib/session/readSessionReader";

export default function HomePage() {
  return (
    <main>
      <h1>Partner knowledge portal</h1>
      <p>
        Box will hold the files. This slice uses a fixture library so sequence 1
        is clickable: public page, partner 404 until login, then the battlecard.
      </p>
      <Suspense fallback={<nav>Loading session…</nav>}>
        <HomeNav />
      </Suspense>
    </main>
  );
}

async function HomeNav() {
  const reader = await readSessionReader();
  const signedIn = reader.kind === "boxUser";

  return (
    <nav>
      <Link href="/products/welcome">Welcome (public)</Link>
      <Link href="/products/sku-a/battlecard">SKU-A battlecard (partner)</Link>
      {signedIn ? (
        <form action={logoutPartner}>
          <button type="submit">Log out</button>
        </form>
      ) : (
        <Link href="/login">Log in</Link>
      )}
    </nav>
  );
}
