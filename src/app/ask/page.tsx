import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { readSessionReader } from "@/lib/session/readSessionReader";

export default function AskPage() {
  return (
    <main className="ask-desk">
      <p className="hero__kicker">Ask desk</p>
      <h1>The library is already listening.</h1>
      <p>
        Use the dock — bottom right, or Ctrl+K — from any page. This desk is
        the same widget, always on.
      </p>
      <Suspense fallback={<p>Loading session…</p>}>
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
      <p>
        Logged out, ask only sees public articles.{" "}
        <Link href="/login">Partner login</Link> unlocks battlecards the App
        User can open.
      </p>
    );
  }
  return <p>Signed in. Partner files follow your Box collaborations.</p>;
}
