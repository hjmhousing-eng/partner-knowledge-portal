# Partner knowledge portal — planning index

Box is the CMS and the trust boundary. Vercel is the site, cache, preview/rollback, and ask-the-library interaction.

Box already holds the files. The existing portal is a weak website. This app puts a real site in front of Box so publishing a page is instant, shipping the site is safe, and asking the library never leaves Box’s permissions.

| Audience | What to read first |
|---|---|
| Binding ADRs | [adr/](./adr/) |
| Why not the alternatives | [02-decisions.md](./02-decisions.md) |
| Diagrams and request paths | [03-sequences.md](./03-sequences.md) |
| System shape | [01-architecture.md](./01-architecture.md) |
| Build order | [04-dev-plan.md](./04-dev-plan.md) |
| Ops questions | [05-operations.md](./05-operations.md) |
| Demo script | [06-demo-script.md](./06-demo-script.md) |

**Vercel pieces in this MVP:**

1. **Next.js Cache Components** — static shell, streamed body, tag invalidation
2. **Preview Deployments + Rolling Releases** — preview a site change; roll back the app without touching Box
3. **AI SDK + AI Gateway** — ask-the-library with a writer, failover, and spend visibility

**Not in the MVP:** Vercel Workflows (ask is one turn, not a week-long run), Vercel Blob (no second file store), a vector database (no corpus copy).
