import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <p className="hero__kicker">404</p>
      <h1>No page, or no collaboration.</h1>
      <p>
        Partner articles 404 until Box says this reader can open the file. We
        do not return 403.
      </p>
      <p>
        <Link href="/">Back to the library</Link>
      </p>
    </main>
  );
}
