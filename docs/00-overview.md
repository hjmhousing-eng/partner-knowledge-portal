# Partner knowledge portal — planning index

**Use case:** #5 — permissioned knowledge site. Box is the CMS and trust boundary. Vercel is the site, cache, preview/rollback, and ask-the-library interaction.

**One sentence:** Box already holds the files. The customer already has a bad portal. We put a real website in front of Box so publishing a *page* is instant, shipping the *site* is safe, and asking the library never leaves Box’s permissions.

| Audience | What to read first |
|---|---|
| Binding ADRs | [adr/](./adr/) |
| You, before the interview | [02-decisions.md](./02-decisions.md) (memorize the “why not”) |
| Diagrams and request paths | [03-sequences.md](./03-sequences.md) |
| System shape | [01-architecture.md](./01-architecture.md) |
| What we actually build in 4–6 hours | [04-dev-plan.md](./04-dev-plan.md) |

**Chosen Vercel primitives (exactly three):**

1. **Next.js Cache Components** — static shell, streamed body, tag invalidation
2. **Preview Deployments + Rolling Releases** — the release path they already lack
3. **AI SDK + AI Gateway** — ask-the-library with model failover and spend visibility

**Explicitly not in the MVP:** Vercel Workflows (request-scoped Q&A, not a week-long run), Vercel Blob (no second file store), a vector database (no corpus copy).
