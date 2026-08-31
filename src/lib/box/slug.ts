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

const DISPLAY_TITLES: Record<string, string> = {
  welcome: "Welcome to the portal",
  "sku-a/overview": "Pulse Controller overview",
  "sku-a/datasheet": "Pulse Controller datasheet",
  "sku-a/install-guide": "Pulse Controller installation guide",
  "sku-a/battlecard": "Pulse Controller battlecard",
  "sku-a/pricing": "Pulse Controller pricing",
  "sku-a/objection-handling": "Pulse Controller objection handling",
  "sku-a/win-stories": "Pulse Controller win stories",
  "sku-b/overview": "Air Handler overview",
  "sku-b/datasheet": "Air Handler datasheet",
  "sku-b/battlecard": "Air Handler battlecard",
  "sku-b/pricing": "Air Handler pricing",
  "company/channel-program": "Channel program",
  "support/getting-started": "Getting started",
  "training/public-calendar": "Training calendar",
  "competitive/acme-controls": "Competitive notes: Acme Controls",
  "playbook/q3-enablement": "Q3 enablement playbook",
  "discount/authorization": "Discount authorization",
};

export function titleFromFileName(name: string): string {
  const slug = slugFromFileName(name);
  if (DISPLAY_TITLES[slug]) {
    return DISPLAY_TITLES[slug];
  }
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

export function librarySection(slug: string): string {
  if (slug.startsWith("sku-a")) {
    return "SKU-A Pulse Controller";
  }
  if (slug.startsWith("sku-b")) {
    return "SKU-B Air Handler";
  }
  if (slug.startsWith("support") || slug.startsWith("training")) {
    return "Support";
  }
  return "Company";
}

export function documentKind(
  slug: string,
  format: ArticleFormat,
): string {
  const leaf = slug.split("/").pop() ?? slug;
  if (format === "pdf") {
    if (leaf.includes("install")) {
      return "Installation guide";
    }
    if (leaf.includes("datasheet")) {
      return "Datasheet";
    }
    return "PDF";
  }
  const labels: Record<string, string> = {
    welcome: "Introduction",
    overview: "Overview",
    battlecard: "Battlecard",
    pricing: "Pricing",
    "objection-handling": "Enablement",
    "win-stories": "Win stories",
    "channel-program": "Program",
    "getting-started": "Support",
    "public-calendar": "Training",
    "acme-controls": "Competitive",
    authorization: "Policy",
    "q3-enablement": "Playbook",
  };
  return labels[leaf] ?? "Document";
}
