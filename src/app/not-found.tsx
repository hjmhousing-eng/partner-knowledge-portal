import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Not found</h1>
      <p>
        That page does not exist, or you do not have access. Partner docs 404
        until you log in.
      </p>
      <p>
        <Link href="/">Home</Link>
      </p>
    </main>
  );
}
