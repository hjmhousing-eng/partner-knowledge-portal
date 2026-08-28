import { Suspense } from "react";
import { connection } from "next/server";
import { loginPartner } from "@/lib/session/actions";
import { demoReviewerEmails } from "@/lib/session/demoReviewers";
import { loadDemoReviewers } from "@/lib/session/loadDemoReviewers";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main>
      <div className="auth-card">
        <h1>Partner login</h1>
        <p>
          Demo emails map to Box App Users. As-User is the gate — not this
          password.
        </p>
        <Suspense fallback={<p>Loading accounts…</p>}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const emails = demoReviewerEmails(loadDemoReviewers());
  const defaultEmail = emails[0] ?? "";

  return (
    <>
      {emails.length > 0 ? (
        <ul className="account-list">
          {emails.map((email) => (
            <li key={email}>{email}</li>
          ))}
        </ul>
      ) : null}
      <LoginError searchParams={searchParams} />
      <form action={loginPartner}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          defaultValue={defaultEmail}
          required
        />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" name="password" required />
        <button type="submit">Enter the library</button>
      </form>
    </>
  );
}

async function LoginError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) {
    return null;
  }
  return <p className="ask-error">Email or password did not match.</p>;
}
