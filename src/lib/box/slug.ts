import type { Audience } from "../articles/loadArticlePage";
import type { ArticleFormat } from "../documents/getDocument";

/** welcome.md → welcome. sku-a--battlecard.md → sku-a/battlecard */
export function slugFromFileName(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/--/g, "/");
}

/** Catalog only publishes markdown and PDF. Other Box files stay out of the site. */
export function articleFormatFromFileName(name: string): ArticleFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return "markdown";
  }
  return null;
}

export function audienceFromFolderName(name: string): Audience | null {
  if (name === "public" || name === "partner") {
    return name;
  }
  return null;
}

export function titleFromFileName(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  return withoutExt
    .split("--")
    .map((segment) => {
      const sku = segment.match(/^sku-([a-z0-9]+)$/i);
      if (sku) {
        return `SKU-${sku[1].toUpperCase()}`;
      }
      return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    })
    .join(" · ");
}
