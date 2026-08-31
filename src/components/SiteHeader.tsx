import { Suspense } from "react";
import Link from "next/link";
import { SessionSkeleton } from "@/components/LibrarySkeletons";
import { logoutPartner } from "@/lib/session/actions";
import { readSessionReader } from "@/lib/session/readSessionReader";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand__mark" aria-hidden />
        <span>
          <strong>Helios</strong>
          <em>Controls</em>
        </span>
      </Link>
      <nav className="site-nav">
        <Link href="/">Library</Link>
        <Link href="/products/sku-a/overview">Products</Link>
        <Link href="/ask">Search</Link>
        <Suspense fallback={<SessionSkeleton />}>
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
      Sign in
    </Link>
  );
}
