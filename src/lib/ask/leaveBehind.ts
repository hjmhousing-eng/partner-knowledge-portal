import {
  gateCatalogEntry,
  type ArticleCatalog,
  type Audience,
} from "../articles/loadArticlePage";
import type { CollaborationLookup, FileId, Reader } from "../access/types";
import type { LoadBody } from "../articles/loadArticlePage";
import { citationHref, type BoxAiAsk } from "./searchLibrary";

export type LeaveBehindCompose = (input: {
  title: string;
  notes: string;
  audience: Audience;
}) => Promise<string>;

export type LeaveBehindResult =
  | { status: "not_found" }
  | {
      status: "ok";
      title: string;
      href: string;
      markdown: string;
    };

const LEAVE_BEHIND_PROMPT =
  "Extract a partner leave-behind from this document: typical applications, differentiation, specs an engineer can see, and anything that must stay confidential to the distributor contract.";

export async function draftLeaveBehind(input: {
  reader: Reader;
  fileId: FileId;
  catalog: ArticleCatalog;
  collaborations: CollaborationLookup;
  boxAi: BoxAiAsk;
  compose: LeaveBehindCompose;
  loadBody?: LoadBody;
}): Promise<LeaveBehindResult> {
  const entry = await input.catalog.byFileId(input.fileId);
  if (!entry) {
    return { status: "not_found" };
  }
  if (!(await gateCatalogEntry(input.reader, entry, input.collaborations))) {
    return { status: "not_found" };
  }

  const asUserId =
    entry.audience === "partner" && input.reader.kind === "boxUser"
      ? input.reader.boxUserId
      : null;

  const notes =
    (await input.boxAi.ask({
      fileIds: [entry.fileId],
      question: LEAVE_BEHIND_PROMPT,
      asUserId,
    })) ??
    (await fallbackNotes(entry.fileId, input.loadBody));
  if (!notes) {
    return { status: "not_found" };
  }

  const markdown = await input.compose({
    title: entry.title,
    notes,
    audience: entry.audience,
  });

  return {
    status: "ok",
    title: entry.title,
    href: citationHref(entry.slug),
    markdown,
  };
}

async function fallbackNotes(fileId: FileId, loadBody?: LoadBody) {
  if (!loadBody) {
    return null;
  }
  const article = await loadBody(fileId);
  const text = article?.markdown?.trim();
  return text ? text.slice(0, 4000) : null;
}
