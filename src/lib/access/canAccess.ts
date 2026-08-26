import type { CollaborationLookup, FileId, Reader } from "./types";

/**
 * Gate for sequence 1: may this reader open this Box file?
 * Anonymous has no Box identity, so we never ask collaborations.
 */
export async function canAccess(
  reader: Reader,
  fileId: FileId,
  collaborations: CollaborationLookup,
): Promise<boolean> {
  if (reader.kind === "anonymous") {
    return false;
  }

  return collaborations.hasAccess(reader.boxUserId, fileId);
}
