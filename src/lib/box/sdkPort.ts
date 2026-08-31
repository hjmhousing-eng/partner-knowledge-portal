import { BoxApiError } from "box-typescript-sdk-gen/lib/box/errors";
import { BoxCcgAuth, BoxClient, CcgConfig } from "box-typescript-sdk-gen";
import { readByteStream } from "box-typescript-sdk-gen/lib/internal/utils";
import type { CatalogEntry } from "../articles/loadArticlePage";
import type { ArticleBody } from "../documents/getDocument";
import type { FileId } from "../access/types";
import { boxLibraryFolderId } from "./config";
import type { BoxLibraryPort } from "./port";
import {
  audienceFromFolderName,
  articleFormatFromFileName,
  slugFromFileName,
  titleFromFileName,
} from "./slug";

function createCcgClient(): BoxClient {
  const clientId = process.env.BOX_CLIENT_ID;
  const clientSecret = process.env.BOX_CLIENT_SECRET;
  const enterpriseId = process.env.BOX_ENTERPRISE_ID;
  if (!clientId || !clientSecret || !enterpriseId) {
    throw new Error("Box CCG env vars are incomplete");
  }

  const auth = new BoxCcgAuth({
    config: new CcgConfig({
      clientId,
      clientSecret,
      enterpriseId,
    }),
  });
  return new BoxClient({ auth });
}

function isFileWithId(value: unknown): value is { type: "file"; id: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const rec = value as { type?: unknown; id?: unknown };
  return rec.type === "file" && typeof rec.id === "string";
}

function fileIdFromSearchEntry(entry: unknown): FileId | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }
  if ("item" in entry) {
    const item = (entry as { item?: unknown }).item;
    return isFileWithId(item) ? item.id : null;
  }
  return isFileWithId(entry) ? entry.id : null;
}

function isAccessDenied(error: unknown): boolean {
  const status =
    error instanceof BoxApiError
      ? error.responseInfo.statusCode
      : typeof error === "object" &&
          error !== null &&
          "responseInfo" in error
        ? (error as { responseInfo?: { statusCode?: number } }).responseInfo
            ?.statusCode
        : undefined;
  return status === 403 || status === 404;
}

const listOptions = {
  queryParams: { limit: 1000, fields: ["id", "name", "type"] },
};

export function createSdkLibraryPort(): BoxLibraryPort {
  const client = createCcgClient();
  const libraryId = boxLibraryFolderId();

  return {
    async probeFileAsUser(boxUserId, fileId) {
      try {
        await client.withAsUserHeader(boxUserId).files.getFileById(fileId);
        return true;
      } catch (error) {
        if (isAccessDenied(error)) {
          return false;
        }
        throw error;
      }
    },

    async loadArticle(fileId): Promise<ArticleBody | null> {
      try {
        const file = await client.files.getFileById(fileId);
        const name = file.name ?? fileId;
        const format = articleFormatFromFileName(name);
        if (!format) {
          return null;
        }
        const title = titleFromFileName(name);
        if (format === "pdf") {
          // Bytes stream after the gate. Cache metadata only (ADR 0002).
          return { fileId, title, format, markdown: "" };
        }
        const downloaded = await client.downloads.downloadFile(fileId);
        if (!downloaded) {
          return null;
        }
        const markdown = (await readByteStream(downloaded)).toString("utf8");
        return {
          fileId,
          title,
          format,
          markdown,
        };
      } catch (error) {
        if (isAccessDenied(error)) {
          return null;
        }
        throw error;
      }
    },

    async listCatalog(): Promise<CatalogEntry[]> {
      const root = await client.folders.getFolderItems(libraryId, listOptions);
      const entries: CatalogEntry[] = [];

      for (const item of root.entries ?? []) {
        if (item.type !== "folder" || !item.id || !item.name) {
          continue;
        }
        const audience = audienceFromFolderName(item.name);
        if (!audience) {
          continue;
        }
        const children = await client.folders.getFolderItems(
          item.id,
          listOptions,
        );
        for (const child of children.entries ?? []) {
          if (child.type !== "file" || !child.id || !child.name) {
            continue;
          }
          const format = articleFormatFromFileName(child.name);
          if (!format) {
            continue;
          }
          entries.push({
            fileId: child.id,
            slug: slugFromFileName(child.name),
            audience,
            title: titleFromFileName(child.name),
            format,
          });
        }
      }

      return entries;
    },

    async searchAsUser(boxUserId, query): Promise<FileId[]> {
      const result = await client
        .withAsUserHeader(boxUserId)
        .search.searchForContent({
          query,
          ancestorFolderIds: [libraryId],
          type: "file",
        });

      if (!("entries" in result) || !result.entries) {
        return [];
      }

      return result.entries.flatMap((entry) => {
        const fileId = fileIdFromSearchEntry(entry);
        return fileId ? [fileId] : [];
      });
    },

    async downloadPdf(fileId, asUserId) {
      try {
        const actor = asUserId
          ? client.withAsUserHeader(asUserId)
          : client;
        const downloaded = await actor.downloads.downloadFile(fileId);
        if (!downloaded) {
          return null;
        }
        return new Uint8Array(await readByteStream(downloaded));
      } catch (error) {
        if (isAccessDenied(error)) {
          return null;
        }
        throw error;
      }
    },

    async askFiles(fileIds, question, asUserId) {
      if (fileIds.length === 0) {
        return null;
      }
      try {
        const actor = asUserId
          ? client.withAsUserHeader(asUserId)
          : client;
        const mode =
          fileIds.length === 1 ? "single_item_qa" : "multiple_item_qa";
        const response = await actor.ai.createAiAsk({
          mode,
          prompt: question,
          items: fileIds.map((id) => ({ id, type: "file" as const })),
          includeCitations: true,
        });
        return response?.answer?.trim() ? response.answer : null;
      } catch (error) {
        if (isAccessDenied(error)) {
          return null;
        }
        return null;
      }
    },
  };
}

let singleton: BoxLibraryPort | undefined;

export function getSdkLibraryPort(): BoxLibraryPort {
  singleton ??= createSdkLibraryPort();
  return singleton;
}
