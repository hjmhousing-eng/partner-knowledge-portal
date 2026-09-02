import Link from "next/link";
import { gateCatalogEntry } from "@/lib/articles/loadArticlePage";
import type { CatalogEntry } from "@/lib/articles/loadArticlePage";
import { portalCatalog, portalCollaborations } from "@/lib/box/runtime";
import { documentKind, librarySection } from "@/lib/box/slug";
import { readSessionReader } from "@/lib/session/readSessionReader";

const SECTION_ORDER = [
  "SKU-A Pulse Controller",
  "SKU-B Air Handler",
  "Company",
  "Support",
];

function grouped(entries: CatalogEntry[]) {
  const bySection = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const section = librarySection(entry.slug);
    const bucket = bySection.get(section) ?? [];
    bucket.push(entry);
    bySection.set(section, bucket);
  }
  return SECTION_ORDER.flatMap((title) => {
    const items = bySection.get(title);
    return items?.length ? [{ title, items }] : [];
  });
}

function Card({ entry }: { entry: CatalogEntry }) {
  return (
    <Link href={`/products/${entry.slug}`} className="library-card">
      <span className="library-card__meta">
        {documentKind(entry.slug, entry.format)}
        {entry.format === "pdf" ? " · PDF" : ""}
      </span>
      <h2>{entry.title}</h2>
    </Link>
  );
}

export async function LibraryCatalog() {
  const reader = await readSessionReader();
  const catalog = portalCatalog();
  const collaborations = portalCollaborations();
  const entries = await catalog.list();
  const publicEntries = grouped(
    entries.filter((entry) => entry.audience === "public"),
  );

  const partnerEntries = entries.filter((row) => row.audience === "partner");
  const partnerVisible =
    reader.kind === "boxUser"
      ? (
          await Promise.all(
            partnerEntries.map(async (entry) => ({
              entry,
              allowed: await gateCatalogEntry(
                reader,
                entry,
                collaborations,
              ),
            })),
          )
        )
          .filter(({ allowed }) => allowed)
          .map(({ entry }) => entry)
      : [];

  return (
    <>
      {publicEntries.map((section) => (
        <section key={section.title} className="catalog-section">
          <h2 className="catalog-section__title">{section.title}</h2>
          <div className="library-grid">
            {section.items.map((entry) => (
              <Card key={entry.fileId} entry={entry} />
            ))}
          </div>
        </section>
      ))}
      {partnerVisible.length > 0 ? (
        <section className="catalog-section">
          <h2 className="catalog-section__title">Assigned to you</h2>
          <div className="library-grid">
            {grouped(partnerVisible).flatMap((section) =>
              section.items.map((entry) => (
                <Card key={entry.fileId} entry={entry} />
              )),
            )}
          </div>
        </section>
      ) : reader.kind === "anonymous" ? (
        <p className="catalog-signin">
          <Link href="/login">Sign in</Link> to open pricing, battlecards, and
          installation guides assigned to your account.
        </p>
      ) : null}
    </>
  );
}
