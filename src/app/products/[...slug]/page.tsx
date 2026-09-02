import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loadArticlePage } from "@/lib/articles/loadArticlePage";
import { portalCatalog, portalCollaborations } from "@/lib/box/runtime";
import { getCachedArticle } from "@/lib/documents/getCachedArticle";
import { readSessionReader } from "@/lib/session/readSessionReader";
import { ArticleMarkdown } from "@/components/ArticleMarkdown";
import { ArticlePdfViewer } from "@/components/ArticlePdfViewer";
import { ArticleSkeleton } from "@/components/LibrarySkeletons";
import { LeaveBehindDraft } from "@/components/LeaveBehindDraft";
import { ArticleAskContext } from "@/components/ArticleAskContext";
import { documentKind } from "@/lib/box/slug";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <main className="article-page">
      <Suspense fallback={<ArticleSkeleton />}>
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
  const articleSlug = slug.join("/");
  const reader = await readSessionReader();
  const result = await loadArticlePage({
    reader,
    slug: articleSlug,
    catalog: portalCatalog(),
    collaborations: portalCollaborations(),
    loadBody: getCachedArticle,
  });

  if (result.status === "not_found") {
    notFound();
  }

  const body =
    result.article.format === "pdf" ? (
      <ArticlePdfViewer
        fileId={result.article.fileId}
        title={result.article.title}
      />
    ) : (
      <ArticleMarkdown markdown={stripLeadingHeading(result.article.markdown)} />
    );

  return (
    <article>
      <header>
        <p className="eyebrow">
          {documentKind(articleSlug, result.article.format)}
        </p>
        <h1>{result.article.title}</h1>
      </header>
      <ArticleAskContext
        context={{
          fileId: result.article.fileId,
          title: result.article.title,
          slug: articleSlug,
        }}
      />
      <LeaveBehindDraft
        fileId={result.article.fileId}
        title={result.article.title}
      />
      {body}
    </article>
  );
}

function stripLeadingHeading(markdown: string) {
  return markdown.replace(/^#\s.+\r?\n+/, "");
}
