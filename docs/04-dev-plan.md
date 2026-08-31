# Build plan

Thin vertical slices. Each slice should leave a commit that records the invariant.

## Demo story

- Library: public markdown, partner markdown, and PDFs in one Box folder.
- Readers: logged-out public, plus demo partners Alex, Sam, and Riley.
- Ask: “What is the Pulse Controller?” cites a public `/products/...` path.
- Webhook: fix a typo in Box, refresh, the page updates without a redeploy.

## Delivery order

| Slice | Ship | Proves |
|---|---|---|
| 1 | Next.js 16, `cacheComponents: true`, deploy to Vercel | Release path exists |
| 2 | Box CCG: list the library, render one article with `use cache` + `cacheTag('doc:'+id)` | Connect boundary |
| 3 | Public vs partner: login gate; ACL as-user; 404 on a partner article when logged out | D5 / D6 |
| 4 | Signed Box webhook → `revalidateTag` (manual `/api/revalidate` as backup) | D8 |
| 5 | Ask: AI SDK `streamText` + Gateway; tools search + Box AI or markdown fallback | D10 / D11 |
| 6 | Fixtures, README click-path, comments on cache/ACL, Preview URL | Operable |

Comment in code at: `use cache` (why no userId), ACL helper (why 404), webhook (why `'max'`), Gateway fallback model.

## Acceptance checks

See the table in `README.md`.

## Out of scope for now

- DocGen, Sign, Hubs admin, full-text OCR
- Multi-tenant Box enterprises
- Translating the corpus
- Workflows Monday digest (phase 2)
- A design system
- Self-serve signup and an in-app admin for partner access (later phase below)

## Later — public-by-default users, admin-granted partner

When we add real accounts:

1. Creating a user (App User or Box OAuth) grants **public audience only** — same as today’s logged-out reader plus a login. No collaboration on `partner/`.
2. Partner access is an **admin action in Box**: collaborate that user on `partner/` or on specific files. The site does not grow an application DB for ACL.
3. Optional later: a thin admin UI that calls the Box collaborations API. Until then, Box is the admin console.

Demo logins stay a JSON map onto existing App Users.
