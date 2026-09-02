# Architecture decisions

Format: **choice → rejected → why → watch**. For “why not X,” start from the rejected column.

---

### D1 — Box stays the CMS; we do not migrate to Contentful / Sanity / SharePoint / Vercel Blob

- **Choice:** Authors keep working in Box. The site reads Box.
- **Rejected:** Move corpus to a headless CMS or Blob.
- **Why:** The customer already paid for Box (ACL, versioning, DLP, legal hold). A second store means a second ACL and a sync job you will get wrong. The bottleneck is the *website*, not the cabinet.
- **Watch:** “Security says files can’t leave Box.” Good — they don’t. We request metadata, text representations, and Box AI. We do not persist file bytes on Vercel.

### D2 — Next.js App Router on Vercel, not Box Hubs / Box Apps / a folder of shared links

- **Choice:** A real website with URLs, nav, preview deployments.
- **Rejected:** Box Hubs (Q&A inside Box), Box Apps (iframe in Box chrome), shared links.
- **Why:** Partners should not need Box chrome. Hubs are not a branded site, have no Preview Deployment of *layout*, and cannot canary a nav change. Box Apps still live *in* Box.
- **Watch:** “Why not just restyle Box?” Because the release unit is the **experience**, not a file.

### D3 — Vercel **Connect** (site in front of Box), not Replace Box

- **Choice:** Connect + replace only the undifferentiated web pipeline.
- **Rejected:** Replace Box; or “augment” by putting Vercel in front of a copy of the files.
- **Why:** Keep Box as the system of record. The slow, risky layer is deploy, preview, and rollback of a portal they already have.

### D4 — Cache Components (`use cache` + `cacheTag` + `revalidateTag`), not full SSR and not full SSG

- **Choice:** Prerendered shell; dynamic ACL hole; cached document payload; webhook invalidation.
- **Rejected:**
  - **SSR everything:** correct ACL, no “instant site,” nothing to say about Cache Components.
  - **SSG/ISR of whole pages including HTML for users:** either public-only or you bake permissions into HTML and leak.
  - **Legacy `export const revalidate`:** Next 16 Cache Components is the rendering model this app uses.
- **Why:** Static shell, streamed dynamic work, and targeted invalidation.
- **Watch:** “User A cached, user B gets A’s page.” Impossible if the cached function never receives `userId` and the ACL gate runs per request. See D5.

### D5 — Authorization is a request-time gate; document cache is identity-free

- **Choice:** `canAccess(user, fileId)` then `getDocument(fileId)` from cache.
- **Rejected:** `getDocumentForUser(user, fileId)` inside `use cache`; or a service account that skips per-user ACL.
- **Why:** Shared cache + user in the key either explodes the cache or leaks if you forget the key. Service-account reads are how partner portals dump pricing PDFs to the wrong tenant.
- **Demo vs prod:** Prod uses the **user’s** Box token. This environment maps demo logins to App Users and calls Box **as-user**. That is not SSO.
- **Watch:** “Service account is easier.” Yes, and it is the vulnerability. We use it only for *public* `audience=public` files, which are intentionally published.

### D6 — Deny with **404**, not 403, for partner docs

- **Choice:** Unknown slug or no access → not found.
- **Rejected:** 403 “you don’t have access to battlecard-v8.”
- **Why:** Don’t leak that a file exists. Same as a well-built CMS.
- **Watch:** “UX wants 403.” Accept for *logged-in users who can see the nav item* if the catalog query is already permissioned (Box metadata search as-user). Then 403 is OK because they already know the title. Catalog must also be as-user, not a cached global nav of all slugs.

### D7 — Nav/catalog is a Box metadata query as the user, not a hardcoded sitemap of every file

- **Choice:** Metadata template `portalDoc`; search/query with the caller’s token; cache **public** nav separately from **partner** nav.
- **Rejected:** One cached `getAllSlugs()` used for everyone; filesystem routes for each PDF.
- **Why:** A global cached sitemap is an ACL leak. Public nav can be cached as `library:public`. Partner nav is dynamic or cached per-role for seconds, not as a single blob.
- **Today:** Two folders (`public/`, `partner/`). Public listing cached. Partner listing only after login, as-user, `cacheLife` short. Production can unify this with `portalDoc` metadata.

### D8 — Box webhooks invalidate cache; we do not poll Box every request

- **Choice:** `FILE.UPLOADED` / `METADATA_INSTANCE_UPDATED` → verify signature → `revalidateTag('doc:{id}', 'max')`.
- **Rejected:** TTL-only (stale partners); poll on every GET (kills the cache story); `revalidatePath('/')` (too coarse).
- **Why:** Authors publish in Box. The site must follow **that** file, not a rebuild. `'max'` = stale-while-revalidate for webhook-driven refresh (Route Handler cannot use `updateTag`).
- **Watch:** “Webhook delivery is at-least-once.” Idempotency key = event id; duplicate POSTs do not double-work. Catch-up: Box Events API if the function was down.

### D9 — No vector database and no “sync Box to S3 for RAG”

- **Choice:** Search-first in Box (keyword/metadata), then Box AI on the shortlist, then Gateway composes with **site** citations.
- **Rejected:** Embeddings copy; Pinecone; dump PDFs to Blob.
- **Why:** A copy goes stale and needs a second ACL. Retrieval stays in Box. The writer, failover, and spend stay on Gateway.
- **Watch:** “Latency of Box search?” Acceptable for Q&A. For the **page** itself we cache. If they insist on RAG later: embeddings of *text reps* still keyed by file id, ACL still Box at query time — phase 3, not MVP.

### D10 — Split AI: Box AI retrieves; AI Gateway / AI SDK composes

- **Choice:** Search Box and ask Box AI before composition. One Gateway request writes the streamed answer and cites `/product/...` URLs.
- **Rejected:** Download files and stuff them into OpenAI; **or** only Box AI.
- **Why:** Box AI keeps bytes in Box and respects collab. Gateway is model flexibility, failover, and spend. The site owns the stream.
- **Watch:** “Why not 100% Box AI?” No failover, no model swap, no unified cost. “Why not 100% Gateway on file bytes?” Residency and a second ACL.

### D11 — AI Gateway, not a raw provider SDK

- **Choice:** `streamText({ model: gateway('...') })` with a fallback chain.
- **Rejected:** Hard-coded OpenAI key; Bedrock in-app; one model forever.
- **Why:** One API for failover and cost. Swap the writer later without rewriting tools.
- **Watch:** “Budget halved.” Drop multi-provider fallback first; keep Cache Components + Box-gated pages + a single model. Don’t drop the ACL gate.

### D12 — Exactly three primitives; Workflows is a spoken phase 2

- **Choice:** Cache Components, Preview/Rolling Releases, AI SDK+Gateway.
- **Rejected:** Also Eve, Workflows, Sandbox, Blob, KV as first-class in the MVP.
- **Why:** These three pieces cover cache, release, and ask. Ask-the-library is **request-scoped**. Workflows would be a nightly digest — a second product. Eve is for durable agents, not a docs site.
- **Watch:** “You didn’t use Workflows.” “Correct. Durability isn’t the problem; publishing and permissioned reads are. I’d add Workflows for a Monday edition, not for `/ask`.”

### D13 — Preview Deployments are for the **app**; Box versions are for the **doc**

- **Choice:** Git change → Preview URL against the **same** Box library (or a sandbox folder via env). Rollback = previous Vercel deployment.
- **Rejected:** Using Box file versions as the site rollback; or rebuilding Docker on ECS for a CSS change.
- **Why:** Two version axes: content (Box) vs experience (Vercel). An incident mid-rollout rolls back the deployment; invoices and docs in Box are untouched.
- **Today:** One Box folder; `BOX_LIBRARY_FOLDER_ID` in env. Preview and prod share it until we split sandbox and prod folders.
- **Watch:** “Preview env must not see unreleased PDFs.” Separate Box folder + separate CCG/OAuth user for preview. That split is not in place yet.

### D14 — Public vs partner is metadata + route group, not two apps

- **Choice:** One Next.js app. `audience=public` pages skip partner login. Partner routes require session.
- **Rejected:** Two Vercel projects; or everything behind login.
- **Why:** One release path. Two cache lives (D4). Matches “we already have a site that’s half marketing, half gated.”

### D15 — Render markdown as pages; PDFs through a site viewer

- **Choice:** Demo corpus = markdown articles + PDFs. Markdown is HTML in our shell. PDFs stream from Box after the **gate** and render in our viewer (PDF.js). Bytes are not stored in the identity-free article cache.
- **Rejected:** Box Preview iframe (leaks Box chrome); text representation as the reader UI (destroys layout); LibreOffice/DOCX pipelines; syncing MDX in git.
- **Why:** The site is the reading surface. Box stays the cabinet. Ask may still use text-rep later; the page must not.

### D16 — Fluid Compute is the default runtime, not a separate product we “add”

- **Choice:** Streaming `/ask` on Functions (Fluid). We don’t pay a unique architecture tax.
- **Rejected:** Always-on ECS agent; Lambda + API Gateway for the site.
- **Why:** Streaming Q&A has idle gaps; Fluid is the honest runtime story. Don’t list it as a fourth primitive; it’s how Functions run.

### D17 — No Vercel KV/Postgres required for MVP

- **Choice:** Box metadata + webhook idempotency in memory/log for demo; prod: small table for webhook event ids (or KV).
- **Rejected:** Postgres as the CMS.
- **Why:** Don’t grow a second source of truth. A duplicate-event table is infrastructure, not content.

### D18 — Region: pin Functions near Box; don’t multi-region the cache story blindly

- **Choice:** Single region for now (`iad1` if US Box).
- **Rejected:** Global edge **execution** of Box API calls from everywhere without saying latency.
- **Why:** Shell can be at the edge. The ACL+Box GET should be close to Box. Cache Components still lets the shell be fast worldwide.
- **Watch:** “No data leaves us-east-1.” Pin Functions + Gateway routing + Box data center. Cached HTML at the edge is a *rendition*, not the source file. Partner bodies can skip edge cache if legal treats HTML as data; the shell can stay.
