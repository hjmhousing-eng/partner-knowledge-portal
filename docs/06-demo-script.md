# Demo script — Helios partner portal

About 20 minutes. Live site: [partner-knowledge-portal.vercel.app](https://partner-knowledge-portal.vercel.app). Keep Box and the Vercel dashboard on a second screen.

Logins (site cookie → Box App User, not Box OAuth):

| Who | Email | Password | What they can open |
|---|---|---|---|
| Public / Riley | riley@example.com | review-riley | Public pages only |
| Sam | sam@example.com | review-sam | SKU battlecards; pricing 404s |
| Alex | alex@example.com | review-alex | Whole `partner/` folder |

Talk about Helios and the two clocks: **content** (Box) and **the website** (Vercel).

---

## Open (2 min)

Helios sells controls through distributors. Authors already live in Box. Partners do not want a folder tree or Box chrome. They want URLs, a site they can trust, and answers that do not leak pricing to the wrong person.

The failure mode today is usually a slow portal or a shared drive. Changing the nav is a production incident. Publishing a PDF means waiting on a rebuild or emailing a link.

We left the files in Box. Vercel is the site in front: cache, preview, rollback, and a streamed ask. Box still owns versions, collab, and audit.

---

## 1. A consulting engineer, no login (3 min)

**Do:** Incognito. Open `/`. The landing has no documents — Library, Search, Sign in. Then `/library`, `/products/welcome`, and `/products/sku-a/overview`.

The shell paints first. The article body streams in. That is Cache Components: chrome is cached, the hole is the page. We did not SSR the whole site on every hit, and we did not bake a logged-out HTML snapshot that includes partner slugs.

**Do:** Open `/products/sku-a/battlecard` while logged out.

404. Same as a missing URL. We do not return 403 and admit the battlecard exists.

**Say:** Public literature is in `public/`. CCG reads those bodies. Partner files are not on this catalog path for an anonymous reader.

---

## 2. Three partners, one library (4 min)

Box collaboration is the ACL. The site does not keep a second permission table.

**Do:** Log in as Riley. Open the battlecard again. Still 404. Riley has no collab on `partner/`.

**Do:** Log out. Log in as Sam. Open `/products/sku-a/battlecard` — 200. Open `/products/sku-a/pricing` — 404. Sam is Viewer on the battlecards only.

**Do:** Log in as Alex. Pricing and the Acme competitive note open.

**Say:** If security asks “did you copy ACL into the app?” — no. The gate calls Box as that App User. Unknown or forbidden is 404.

---

## 3. Ask the library (5 min)

**Do:** Still as a logged-out window, type in the header search (or Ctrl-K). “What is the Pulse Controller?” The right sidebar shows search → Box AI → the answer.

Search is not cached. Box search and Box AI retrieve gated notes first, then one AI Gateway request writes a short answer with `/products/...` links. Gateway never gets the PDF bytes. Box AI reads the file in Box.

**Do:** Open the Pulse datasheet, click **Ask about this article**, and ask, “What does this product do?” The panel shows the pinned article and limits that question to it. Click **Search whole library** to return to broader questions.

**Must:** A public path. **Must not:** multipliers or partner pricing.

**Do:** As Alex, “How do we handle Acme?”

**Must:** Battlecard or competitive path. **Must not:** files outside this library.

**Say:** If the primary writer is down or rate-limited, `ASK_FALLBACK_MODEL` is the same tools on a second Gateway model. We do not rewrite the app to switch vendors.

If Search errors, wait a minute (free-tier Gateway limits). Do not mash Send.

---

## 4. Leave-behind (3 min)

**Do:** Logged out, `/products/sku-a/overview`. Draft leave-behind.

Box AI extracts notes. Gateway writes Share / Keep internal. Public source: the whole brief can go to an engineer.

**Do:** As Alex, a battlecard. The draft can separate engineer-facing specs from multipliers and contract terms.

---

## 5. Author publishes in Box — no redeploy (3 min)

This is the cache story.

**Do:** In Box, edit one sentence on a public article (overview or welcome). Save.

Webhook on `Partner_Application` hits `/api/webhooks/box`. Signature check, event id, `revalidateTag("doc:{fileId}", "max")`. Next refresh shows the new sentence. We did not rebuild the Vercel project.

**Say:** Authors keep Box. Vercel follows that file. Box versions are not the site rollback.

If the webhook is slow, `POST /api/revalidate?secret=…&fileId=…` is the backup. Do not pretend TTL-only is the design.

---

## 6. Engineer changes the site — Box is untouched (3 min)

This is the release story. Show it if you have a Preview URL; otherwise talk it.

**Do:** Open a Preview deployment of a nav or copy change. Same Box library today (preview and prod share the folder — say that). Click the same articles.

**Say:** Git change → Preview URL. Merge → new production deployment. The previous deployment stays live. Rollback is the last Vercel deployment. Invoices and PDFs in Box do not move.

Rolling Releases (5% → 100%) is the canary we would use on Pro. Hobby can still preview and roll back a deployment.

**Contrast with beat 5:** A typo in a battlecard is a Box upload. A typo in the header is a Vercel rollback. Two clocks.

---

## Close (1 min)

A bad sentence in a battlecard is a Box upload. A bad sentence in the header is yesterday’s Vercel deployment. Same incident meeting, two rollbacks.

Next on the roadmap: Okta to the user’s Box token, a sandbox folder so Preview cannot see unreleased PDFs, and a Monday edition if they want a digest. `/ask` stays a single turn.

---

## If something breaks

| Symptom | What to do |
|---|---|
| Battlecard 200 while logged out | Stop. Gate is wrong. |
| Riley sees pricing | Stop. Collab or catalog is wrong. |
| Ask cites box.com | Stop. Citations must be site paths. |
| Search rate-limited | Wait; do not retry in a loop. Leave-behind still shows Box AI notes if Gateway is down. |
| Edit in Box, page stale | Check webhook HMAC; use `/api/revalidate`. |
| Preview shows tomorrow’s unreleased PDF | Known gap: one library folder. Separate folder + credentials is the fix. |
