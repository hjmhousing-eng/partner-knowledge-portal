import { describe, expect, it } from "vitest";
import {
  articleFormatFromFileName,
  audienceFromFolderName,
  documentKind,
  librarySection,
  slugFromFileName,
  titleFromFileName,
} from "./slug";

describe("slugFromFileName", () => {
  it("maps a double hyphen to a slash and strips the extension", () => {
    expect(slugFromFileName("sku-a--battlecard.md")).toBe("sku-a/battlecard");
    expect(slugFromFileName("welcome.md")).toBe("welcome");
    expect(slugFromFileName("sku-a--datasheet.pdf")).toBe("sku-a/datasheet");
  });
});

describe("articleFormatFromFileName", () => {
  it("only catalogs markdown and PDF", () => {
    expect(articleFormatFromFileName("sku-a--datasheet.pdf")).toBe("pdf");
    expect(articleFormatFromFileName("welcome.md")).toBe("markdown");
    expect(articleFormatFromFileName("notes.docx")).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("turns filename segments into a display title", () => {
    expect(titleFromFileName("sku-a--battlecard.md")).toBe(
      "Pulse Controller battlecard",
    );
    expect(titleFromFileName("welcome.md")).toBe("Welcome to the portal");
    expect(titleFromFileName("sku-a--datasheet.pdf")).toBe(
      "Pulse Controller datasheet",
    );
  });
});

describe("audienceFromFolderName", () => {
  it("only treats public and partner folders as catalog roots", () => {
    expect(audienceFromFolderName("public")).toBe("public");
    expect(audienceFromFolderName("partner")).toBe("partner");
    expect(audienceFromFolderName("other")).toBeNull();
  });
});

describe("librarySection", () => {
  it("groups slugs by product line and support", () => {
    expect(librarySection("sku-a/datasheet")).toBe("SKU-A Pulse Controller");
    expect(librarySection("sku-b/overview")).toBe("SKU-B Air Handler");
    expect(librarySection("support/getting-started")).toBe("Support");
    expect(librarySection("welcome")).toBe("Company");
  });
});

describe("documentKind", () => {
  it("labels PDFs and article leaves for the catalog", () => {
    expect(documentKind("sku-a/datasheet", "pdf")).toBe("Datasheet");
    expect(documentKind("sku-a/install-guide", "pdf")).toBe(
      "Installation guide",
    );
    expect(documentKind("sku-a/battlecard", "markdown")).toBe("Battlecard");
  });
});
