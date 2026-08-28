export type DemoReviewer = {
  email: string;
  password: string;
  boxUserId: string;
};

export function parseDemoReviewersJson(raw: string): DemoReviewer[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) {
    return null;
  }

  const reviewers: DemoReviewer[] = [];
  for (const row of parsed) {
    if (typeof row !== "object" || row === null) {
      return null;
    }
    const rec = row as {
      email?: unknown;
      password?: unknown;
      boxUserId?: unknown;
    };
    if (
      typeof rec.email !== "string" ||
      typeof rec.password !== "string" ||
      typeof rec.boxUserId !== "string"
    ) {
      return null;
    }
    const email = rec.email.trim();
    const boxUserId = rec.boxUserId.trim();
    if (!email || !rec.password || !boxUserId) {
      return null;
    }
    reviewers.push({ email, password: rec.password, boxUserId });
  }
  return reviewers;
}

export function authenticateDemoReviewer(
  email: string,
  password: string,
  reviewers: readonly DemoReviewer[],
): DemoReviewer | null {
  const needle = email.trim().toLowerCase();
  return (
    reviewers.find(
      (reviewer) =>
        reviewer.email.toLowerCase() === needle &&
        reviewer.password === password,
    ) ?? null
  );
}

export function isKnownDemoBoxUserId(
  boxUserId: string,
  reviewers: readonly DemoReviewer[],
): boolean {
  return reviewers.some((reviewer) => reviewer.boxUserId === boxUserId);
}

export function demoReviewerEmails(
  reviewers: readonly DemoReviewer[],
): string[] {
  return reviewers.map((reviewer) => reviewer.email);
}
