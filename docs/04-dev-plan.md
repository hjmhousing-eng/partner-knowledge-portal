# Dev plan (4–6 hours + interview artifact)

Build a **thin vertical slice**, not a CMS. Every hour should leave a commit they can see in history.

## Demo narrative (canned)

- Library: 4–6 docs in one Box folder (3 public markdown, 2 partner markdown, 1 PDF).
- Users: `public` (no login) and test partner `partner@example.com` / password (or Box OAuth).
- Ask examples: “What is the SKU-A objection handling?” → citation to `/products/sku-a/battlecard`.
- Webhook: upload a typo fix in Box, refresh, page updates without redeploy.

## Hour-by-hour

| Hour | Ship | Proves |
|---|---|---|
| 0.5 | Next.js 16, `cacheComponents: true`, deploy empty to Vercel | Release path exists |
| 1 | Box CCG or OAuth: list folder, render one `.md` at `/docs/[slug]` with `use cache` + `cacheTag('doc:'+id)` | Connect boundary |
| 2 | Public vs partner: login gate; ACL as-user; 404 on partner doc when logged out | D5 / D6 |
| 3 | `revalidateTag` from a signed webhook (or a manual `/api/revalidate?secret=` if webhook setup slips) | D8 — **must have one invalidation path** |
| 4 | Ask box: AI SDK `streamText` + Gateway; tools search + Box AI or text-rep fallback; stream in UI | D10 / D11 |
| 5 | Canned fixtures, README click-path, comments on cache/ACL, Preview URL in README | Submission bar |
| 6 | Buffer: webhook signature, related-docs from metadata, rollback screenshot/notes | Polish |

If hour 3 slips, a **secret-protected revalidate route** you trigger after a Box upload is acceptable for the demo if you **diagram** the real webhook and list it under limitations. Prefer a real webhook.

## Repo hygiene (they asked for commit history)

1. `chore: next.js 16 cache components scaffold`
2. `feat: read markdown from Box and cache by file id`
3. `feat: partner gate and as-user ACL`
4. `feat: box webhook revalidateTag`
5. `feat: ask library via AI gateway tools`
6. `docs: demo path, architecture pointers, limitations`

Comment in code at: `use cache` (why no userId), ACL helper (why 404), webhook (why `'max'`), Gateway fallback model.

## Submission packet (assessment step 4)

1. Problem: partner portal is a bad website; authors already in Box; deploys are scary.
2. Current: SharePoint/custom/Box folder. Target: diagram in `01-architecture.md`.
3. Three primitives + trade-offs: `02-decisions.md` D4, D12, D13.
4. Public URL + repo.
5. Rollout: preview → 5% rolling → rollback previous deployment.
6. Success: TTFB for shell; publish-to-live without redeploy; ask citations stay in-ACL; deploy rollback ≠ content rollback.
7. Limitations: preview webhook, Box AI fallback, demo auth, no Workflows.
8. Tooling: Cursor; AI behavior validated with 5 fixed questions (expected slugs, must not cite partner docs when logged out).

## Eval set (write this in README)

| # | User | Question | Must | Must not |
|---|---|---|---|---|
| 1 | public | What is SKU-A? | Public battlecard URL | Partner-only pricing file |
| 2 | partner | How do we handle competitor X? | Partner battlecard | Files outside folder |
| 3 | logged out | (open partner URL) | 404 | 200 |
| 4 | partner | After webhook edit | New sentence on page | Old cache forever |
| 5 | partner | Gateway fallback (optional) | Still answers if you kill primary model in config | App rewrite |

## Out of scope (say no)

- DocGen, Sign, Hubs admin, full-text OCR pipeline
- Multi-tenant Box enterprises
- Translating the corpus
- Workflows Monday digest (phase 2 talking point)
- Pixel-perfect design system
- **Self-serve signup and an in-app admin for partner access** (later phase below)

## Later phase — public-by-default users, admin-granted partner

Not this take-home. When we add real accounts:

1. Creating a user (App User or Box OAuth identity) grants **public audience only** — same as today’s logged-out reader plus a login. No collaboration on `partner/`.
2. Partner access is an **admin action in Box**: collaborate that user on `partner/` or on specific files. The site does not grow an application DB for ACL.
3. Optional later: a thin admin UI that calls the Box collaborations API. Until then, Box is the admin console.

Demo logins stay a JSON map onto existing App Users.
