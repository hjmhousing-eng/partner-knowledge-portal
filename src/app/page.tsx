import { Suspense } from "react";
import Link from "next/link";
import { portalCatalog } from "@/lib/box/runtime";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="hero__kicker">Helios Controls · Channel</p>
        <h1>Specs in public. The close stays behind the gate.</h1>
        <p>
          This is the partner website in front of the Box library. Public pages
          are open. Battlecards, multipliers, and competitive notes follow Box
          collaborations — unknown or forbidden URLs 404.
        </p>
      </section>
      <Suspense fallback={<p>Loading the library…</p>}>
        <PublicLibrary />
      </Suspense>
    </main>
  );
}

async function PublicLibrary() {
  const entries = await portalCatalog().list();
  const publicEntries = entries.filter((entry) => entry.audience === "public");

  return (
    <>
      <div className="library-grid">
        {publicEntries.map((entry) => (
          <Link
            key={entry.fileId}
            href={`/products/${entry.slug}`}
            className="library-card"
          >
            <span className="library-card__meta">
              {entry.format === "pdf" ? "Public PDF" : "Public article"}
            </span>
            <h2>{entry.title}</h2>
          </Link>
        ))}
      </div>
      <aside className="partner-callout">
        <h2>Distributors</h2>
        <p>
          Partner enablement is not listed here. Log in, then open the SKU-A
          battlecard — or ask from the dock. Sam can open battlecards; Alex can
          open pricing. Riley cannot.
        </p>
        <p>
          <Link href="/login">Partner login</Link>
          {" · "}
          <Link href="/products/sku-a/battlecard">SKU-A battlecard</Link>
        </p>
      </aside>
    </>
  );
}
