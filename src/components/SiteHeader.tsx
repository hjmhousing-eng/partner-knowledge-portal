import { Suspense } from "react";
import Link from "next/link";
import { logoutPartner } from "@/lib/session/actions";
import { readSessionReader } from "@/lib/session/readSessionReader";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand__mark" aria-hidden />
        <span>
          <strong>Helios</strong>
          <em>Partner library</em>
        </span>
      </Link>
      <nav className="site-nav">
        <Link href="/">Library</Link>
        <Link href="/products/sku-a/overview">SKU-A</Link>
        <Link href="/ask">Ask desk</Link>
        <Suspense fallback={<span className="nav-session">Session…</span>}>
          <SessionControls />
        </Suspense>
      </nav>
    </header>
  );
}

async function SessionControls() {
  const reader = await readSessionReader();
  if (reader.kind === "boxUser") {
    return (
      <form action={logoutPartner}>
        <button type="submit" className="text-btn">
          Log out
        </button>
      </form>
    );
  }
  return (
    <Link href="/login" className="nav-login">
      Partner login
    </Link>
  );
}
