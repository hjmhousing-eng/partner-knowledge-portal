export function CatalogSkeleton() {
  return (
    <div className="catalog-skeleton" aria-busy="true">
      <span className="sr-only">Loading the library</span>
      {["a", "b", "c", "d"].map((section) => (
        <section key={section} className="catalog-section" aria-hidden>
          <div className="skeleton skeleton--section" />
          <div className="library-grid">
            <PlaceholderCard />
            <PlaceholderCard />
          </div>
        </section>
      ))}
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="library-card library-card--placeholder">
      <span className="skeleton skeleton--meta" />
      <span className="skeleton skeleton--title" />
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <article className="article-skeleton" aria-busy="true">
      <span className="sr-only">Loading document</span>
      <header aria-hidden>
        <span className="skeleton skeleton--meta" />
        <span className="skeleton skeleton--headline" />
      </header>
      <div className="prose-skeleton" aria-hidden>
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--line skeleton--line-mid" />
        <span className="skeleton skeleton--line skeleton--line-short" />
      </div>
    </article>
  );
}

export function SessionSkeleton() {
  return <span className="skeleton skeleton--nav-login" aria-hidden />;
}
