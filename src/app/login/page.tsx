import { Suspense } from "react";
import { loginPartner } from "@/lib/session/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main>
      <div className="auth-card">
        <h1>Sign in</h1>
        <p>Use the email on file for your distributor account.</p>
        <Suspense fallback={null}>
          <LoginError searchParams={searchParams} />
        </Suspense>
        <form action={loginPartner}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
          <button type="submit">Continue</button>
        </form>
      </div>
    </main>
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
