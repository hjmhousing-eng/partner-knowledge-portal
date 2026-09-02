# Architecture

## Problem (no Box jargon)

A company already publishes partner enablement, product docs, or an intranet as files. People consume that as a slow or scary website — SharePoint, a homegrown app, or “here is a folder.” Changing the nav, search, or layout is a production incident. Authors are fine; **shipping the experience** is not.

## Target shape

Two planes. Nothing important is copied off Box.

```
 Authors ──write──►  Box (files, versions, ACL, metadata, audit)
                              │
                              │  metadata + file IDs + webhooks
                              ▼
 Readers ──browser──►  Vercel (Next.js)
                         ├─ Edge: cached shell (nav, chrome)
                         ├─ Function: “may this user open this file?” (Box, never from shared cache)
                         ├─ Cache: document payload tagged `doc:{fileId}`
                         └─ Stream: Box retrieval, then one AI Gateway writer call
```

## What stays vs what moves

| Stays in Box | Moves onto Vercel | Why |
|---|---|---|
| Files and versions | Page rendering | Box is the CMS |
| Permissions / collaborations | Session cookie + SSO mapping | One ACL, not two |
| Audit, DLP, retention | Preview / canary / rollback of the **app** | Box versions docs; Vercel versions the site |
| Box AI (retrieve / extract in-place) | AI Gateway (compose the answer, failover, cost) | Bytes stay in Box; the *site* owns the interaction |
| IdP (Okta / Entra) | Login UI and route gates | Identity already exists |
| — | Webhook receiver + `revalidateTag` | Box cannot invalidate a Next.js cache |

## Logical components

| Component | Responsibility |
|---|---|
| `app/(public)/*` | Marketing/help chrome. Heavily cached. |
| `app/(portal)/[...slug]` | Article route. Gate then cached body. |
| `lib/box/content.ts` | Metadata query + file text/preview. **`use cache` + `cacheTag`. No user id in args.** |
| `lib/box/acl.ts` | `canUserAccess(user, fileId)`. Dynamic. Not in the shared document cache. |
| `lib/box/map-slug.ts` | `portal_slug` metadata → file id. Cached as `library`. |
| `app/api/webhooks/box/route.ts` | Verify signature, idempotency, `revalidateTag(doc:{id}, 'max')`. |
| `app/api/ask/route.ts` | Box search and Box AI Q&A, then one `streamText` call through Gateway. |
| Box metadata template `portalDoc` | `slug`, `title`, `audience` (`public` \| `partner`), `product`, `nav_group` |

## Cache contract

| Data | Cached? | Tag | Invalidated by |
|---|---|---|---|
| Layout, nav chrome | Yes (`use cache`, long `cacheLife`) | `shell` | Rare; deploy or nav metadata change |
| Slug → file id catalog | Yes | `library` | Webhook on metadata/file in the library folder |
| Document body (title, markdown/HTML, related ids) | Yes | `doc:{fileId}` | Webhook on that file |
| “May user U open file F?” | **No** (or `acl:{u}:{f}` with `cacheLife` of seconds, never shared across users) | — | Login/session |
| Ask-the-library answer | **No** | — | — |

**Invariant:** a `use cache` function must not take `userId` as an argument for document bodies. Same bytes for every authorized reader. Authorization is a **gate around** the cache, not **inside** it.

## Production additions (not all built yet)

- SSO (Okta) → Box token as the user (`as-user` or OAuth)
- Function region pinned near Box (e.g. `iad1` if Box is US)
- Rolling Releases 5% → 100%; rollback = previous deployment still live
- Box webhook + Events API catch-up if the receiver was down
- Same-origin PDF stream after the gate; site viewer (not Box Preview chrome)
- Optional Workflows: nightly “what changed” edition (phase 2)

## Connectivity honesty

Box’s API is public HTTPS (`api.box.com`). **Secure Compute / VPC peering is not required** to reach Box. Use those only if *other* systems stay in a VPC (internal search, entitlements). Box is not in the customer’s VPC.
