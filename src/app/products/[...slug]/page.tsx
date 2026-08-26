import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadArticlePage } from "@/lib/articles/loadArticlePage";
import { getCachedArticle } from "@/lib/documents/getCachedArticle";
import {
  fixtureCatalog,
  fixtureCollaborations,
} from "@/lib/fixtures/demoLibrary";
import { readSessionReader } from "@/lib/session/readSessionReader";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <main>
      <p>
        <Link href="/">Home</Link>
      </p>
      <Suspense fallback={<p>Loading article…</p>}>
        <Article params={params} />
      </Suspense>
    </main>
  );
}

async function Article({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const reader = await readSessionReader();
  const result = await loadArticlePage({
    reader,
    slug: slug.join("/"),
    catalog: fixtureCatalog,
    collaborations: fixtureCollaborations,
    loadBody: getCachedArticle,
  });

  if (result.status === "not_found") {
    notFound();
  }

  return (
    <article>
      <h1>{result.article.title}</h1>
      <pre>{result.article.markdown}</pre>
    </article>
  );
}
