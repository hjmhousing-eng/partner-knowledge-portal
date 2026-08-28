import { describe, expect, it } from "vitest";
import {
  articleFormatFromFileName,
  audienceFromFolderName,
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
    expect(titleFromFileName("sku-a--battlecard.md")).toBe("SKU-A · Battlecard");
    expect(titleFromFileName("welcome.md")).toBe("Welcome");
  });
});

describe("audienceFromFolderName", () => {
  it("only treats public and partner folders as catalog roots", () => {
    expect(audienceFromFolderName("public")).toBe("public");
    expect(audienceFromFolderName("partner")).toBe("partner");
    expect(audienceFromFolderName("other")).toBeNull();
  });
});
