import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { readSessionReader } from "@/lib/session/readSessionReader";

export default function AskPage() {
  return (
    <main className="ask-desk">
      <p className="hero__kicker">Search</p>
      <h1 className="page-title">Search</h1>
      <p className="page-lead">
        Search product literature from any page using the panel at the lower
        right, or press Ctrl+K. Results only include documents you can open.
      </p>
      <Suspense fallback={null}>
        <AskHint />
      </Suspense>
    </main>
  );
}

async function AskHint() {
  await connection();
  const reader = await readSessionReader();
  if (reader.kind === "anonymous") {
    return (
      <p className="page-lead">
        You are browsing public literature.{" "}
        <Link href="/login">Sign in</Link> to include documents assigned to
        your account.
      </p>
    );
  }
  return (
    <p className="page-lead">
      Signed in. Results follow the documents assigned to your account.
    </p>
  );
}
