import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="hero__kicker">Distributor portal</p>
          <h1>Controls knowledge, ready for the job.</h1>
          <p className="home-hero__lede">
            Product literature, account documents, and practical answers for
            Helios RTU and AHU controls.
          </p>
          <div className="home-hero__action">
            <Link href="/library" className="home-primary">
              Browse the library
              <span aria-hidden>↗</span>
            </Link>
            <p>
              Need something specific? Ask from the search bar above.
            </p>
          </div>
        </div>
        <div className="home-system" aria-hidden="true">
          <div className="home-system__rail">
            <span />
            <span />
            <span />
          </div>
          <div className="home-system__field">
            <span className="home-system__eyebrow">Helios network</span>
            <strong>RTU / AHU</strong>
            <div className="home-system__signal">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="home-system__status">Systems online</span>
          </div>
        </div>
      </section>
    </main>
  );
}
