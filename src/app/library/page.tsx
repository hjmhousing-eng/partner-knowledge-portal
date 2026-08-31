import { Suspense } from "react";
import { LibraryCatalog } from "@/components/LibraryCatalog";
import { CatalogSkeleton } from "@/components/LibrarySkeletons";

export default function LibraryPage() {
  return (
    <main>
      <section className="library-intro">
        <p className="hero__kicker">Library</p>
        <h1>Resource library</h1>
        <p>
          Specs, program documents, and training for Helios Controls channel
          partners. Sign in to see materials assigned to your account.
        </p>
      </section>
      <Suspense fallback={<CatalogSkeleton />}>
        <LibraryCatalog />
      </Suspense>
    </main>
  );
}
