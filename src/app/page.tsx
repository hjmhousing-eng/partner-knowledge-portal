import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <section className="home-hero">
        <p className="hero__kicker">Distributor portal</p>
        <h1>The desk for the job on the roof</h1>
        <p>
          Helios Controls ships packaged RTU and AHU sequences through the
          channel. Find product literature, account documents, and answers in
          one place.
        </p>
      </section>
      <div className="home-paths">
        <Link href="/library" className="home-path">
          <span className="home-path__meta">Browse</span>
          <strong>Library</strong>
          <span>Datasheets, overviews, and the documents on your account.</span>
        </Link>
        <Link href="/?ask=1" className="home-path">
          <span className="home-path__meta">Ask</span>
          <strong>Search</strong>
          <span>
            Type in the bar above. We only answer from files you can open.
          </span>
        </Link>
        <Link href="/login" className="home-path">
          <span className="home-path__meta">Account</span>
          <strong>Sign in</strong>
          <span>
            Open pricing, battlecards, and install guides for your branch.
          </span>
        </Link>
      </div>
    </main>
  );
}
