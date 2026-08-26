import type { FileId, Reader } from "../access/types";

export type LibraryHit = {
  fileId: FileId;
  title: string;
  slug: string;
};

export type LibrarySearch = {
  searchAsUser(boxUserId: string, query: string): Promise<LibraryHit[]>;
};

/**
 * Ask-tool: search the library as this reader. Anonymous never hits Box.
 */
export async function searchLibrary(
  reader: Reader,
  query: string,
  search: LibrarySearch,
): Promise<LibraryHit[]> {
  if (reader.kind === "anonymous") {
    return [];
  }

  return search.searchAsUser(reader.boxUserId, query);
}

/** Citations in answers are portal routes, not box.com file links. */
export function citationHref(slug: string): string {
  const path = slug.replace(/^\/+/, "");
  return `/products/${path}`;
}
