# Live-session curveballs (pre-answers)

Use the decision id. Keep answers short.

**“Security: no file bytes on Vercel.”**  
D1 + D10. Pages use metadata + text rep / Box Preview. Ask uses Box AI as a tool. Disk/Blob is not a store.

**“No data leaves us-east-1.”**  
Pin Functions to `iad1`. Gateway: constrain providers/regions if required. Box: US zone. Partner **bodies** can skip edge cache if legal treats HTML as data (D18). Shell can remain cached.

**“The session store can’t move.”**  
We don’t store content in a session DB. Session is a cookie. ACL is Box. Cache is renditions keyed by file id.

**“Budget halved.”**  
Cut Gateway multi-provider fallback. Keep Cache Components, Box ACL gate, one model. Don’t cut webhooks for a cheaper poll-every-request.

**“Just use Box Hubs.”**  
D2. Hubs are not a partner website and don’t give preview/canary of the experience.

**“Service account for everything.”**  
D5. That’s how you leak. Public files only.

**“Why didn’t you use Workflows / Eve?”**  
D12. Wrong failure mode.

**“Preview sees tomorrow’s unreleased PDF.”**  
D13. Separate Box folder + credentials for preview. Known gap if demo shares one folder.

**“Webhook storms / retries.”**  
D8. Verify signature, idempotent event ids, fetch file again, narrow tags.

**“User A then User B on same CDN node.”**  
D4/D5. Cached payload has no PII. Gate runs every time. Partner nav is not one global cache of all slugs.

**“Box is down.”**  
Shell still serves. Cached `doc:{id}` still serves last good body (SWR). Ask fails closed. We do not fail open on ACL (if ACL call fails, 404/503, never 200).

**“Make it fully agentic.”**  
The site is not an agent. `/ask` is a tool-using turn. Agents that write back to Box would be Workflows + human confirm — different product (#1).

**“Canary the content, not the app.”**  
Content canary is Box: publish to a `staging` folder / metadata `status=draft`. App canary is Rolling Releases. Don’t mix them.
