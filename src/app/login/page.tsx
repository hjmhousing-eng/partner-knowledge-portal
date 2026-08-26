import { Suspense } from "react";
import { loginPartner } from "@/lib/session/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main>
      <h1>Partner login</h1>
      <p>Demo account: partner@example.com / partner</p>
      <Suspense>
        <LoginError searchParams={searchParams} />
      </Suspense>
      <form action={loginPartner}>
        <p>
          <label>
            Email
            <br />
            <input
              type="email"
              name="email"
              defaultValue="partner@example.com"
              required
            />
          </label>
        </p>
        <p>
          <label>
            Password
            <br />
            <input type="password" name="password" required />
          </label>
        </p>
        <button type="submit">Log in</button>
      </form>
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
  return <p>Email or password did not match.</p>;
}
