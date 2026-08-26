export type FileId = string;

export type Reader =
  | { kind: "anonymous" }
  | { kind: "boxUser"; boxUserId: string };

/**
 * Box collaborations for one reader. Pages must not call the Box SDK;
 * they pass this adapter into canAccess.
 */
export type CollaborationLookup = {
  hasAccess(boxUserId: string, fileId: FileId): Promise<boolean>;
};
