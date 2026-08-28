import { revalidateDocumentTag } from "@/lib/box/runtime";

/** Manual invalidation if a Box webhook is not wired yet. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || url.searchParams.get("secret") !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  const fileId = url.searchParams.get("fileId");
  if (!fileId) {
    return new Response("missing fileId", { status: 400 });
  }

  await revalidateDocumentTag(fileId);
  return Response.json({ revalidated: true, fileId });
}
