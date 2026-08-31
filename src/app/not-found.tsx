import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <p className="hero__kicker">Not available</p>
      <h1 className="page-title">This document is not available</h1>
      <p className="page-lead">
        It may have been moved, or it may not be assigned to your account.
      </p>
      <p>
        <Link href="/">Return to the library</Link>
      </p>
    </main>
  );
}
