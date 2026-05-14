import { describe, expect, it } from "vitest";
import {
  isPackageAuthor,
  packageAuthorOrUndefined,
  parsePackageAuthor,
  stringifyPackageAuthor
} from "../src/index.js";

describe("parsePackageAuthor", () => {
  it("parses a complete package person string", () => {
    const result = parsePackageAuthor("Ada Lovelace <ada@example.dev> (https://example.dev)");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.author).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.dev",
      url: "https://example.dev"
    });
    expect(result.tokens.map((token) => token.kind)).toEqual(["email", "url", "name"]);
  });

  it("accepts URL before email", () => {
    const result = parsePackageAuthor("Ada (https://example.dev) <ada@example.dev>");

    expect(result.ok).toBe(true);
    expect(result.author).toEqual({
      name: "Ada",
      email: "ada@example.dev",
      url: "https://example.dev"
    });
  });

  it("returns diagnostics for empty input", () => {
    const result = parsePackageAuthor("   ");

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        code: "empty-input",
        message: "Input is empty.",
        index: 0
      }
    ]);
  });

  it("returns diagnostics for non-string input", () => {
    const result = parsePackageAuthor(null);

    expect(result.ok).toBe(false);
    expect(result.input).toBe("");
    expect(result.issues).toEqual([
      {
        code: "invalid-input",
        message: "Input must be a package person string.",
        index: 0
      }
    ]);
  });

  it("returns diagnostics for invalid email and URL", () => {
    const result = parsePackageAuthor("Ada <not-an-email> (ftp://example.dev)");

    expect(result.ok).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(["invalid-email", "invalid-url"]);
    expect(result.author.name).toBe("Ada");
  });

  it("detects duplicate fields", () => {
    const result = parsePackageAuthor("Ada <a@example.dev> <b@example.dev>");

    expect(result.ok).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(["duplicate-email"]);
  });

  it("handles punctuation and accents in names", () => {
    const result = parsePackageAuthor("Équipe Démo, Inc. <contact@example.fr>");

    expect(result.ok).toBe(true);
    expect(result.author.name).toBe("Équipe Démo, Inc.");
  });

  it("supports bare URL parsing by default", () => {
    const result = parsePackageAuthor("https://example.dev");

    expect(result.ok).toBe(true);
    expect(result.author).toEqual({ url: "https://example.dev" });
  });

  it("rejects bare URLs when bare URL parsing is disabled", () => {
    const result = parsePackageAuthor("https://example.dev", { allowBareUrl: false });

    expect(result.ok).toBe(false);
    expect(result.author).toEqual({});
    expect(result.issues[0]?.code).toBe("bare-url-disabled");
  });

  it("keeps non-negative source spans when unexpected closing tokens are present", () => {
    const result = parsePackageAuthor("Ada <ada@example.dev> trailing )");

    expect(result.ok).toBe(false);
    expect(result.author.name).toBe("Ada trailing");
    expect(result.tokens.every((token) => token.start >= 0 && token.end >= token.start)).toBe(true);
    expect(result.issues.map((item) => item.code)).toContain("unexpected-token");
  });

  it("can reject overlong input", () => {
    const result = parsePackageAuthor("Ada Lovelace", { maxInputLength: 3 });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("input-too-long");
  });

  it("ignores invalid max length options instead of rejecting everything", () => {
    const result = parsePackageAuthor("Ada Lovelace", { maxInputLength: -1 });

    expect(result.ok).toBe(true);
    expect(result.author.name).toBe("Ada Lovelace");
  });

  it("handles runtime-invalid options without throwing", () => {
    const result = parsePackageAuthor("Ada Lovelace", "bad options" as never);

    expect(result.ok).toBe(false);
    expect(result.author.name).toBe("Ada Lovelace");
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "invalid-options" }));
  });
});

describe("helpers", () => {
  it("returns undefined for invalid input", () => {
    expect(packageAuthorOrUndefined("Ada <bad-email>")).toBeUndefined();
    expect(packageAuthorOrUndefined(null)).toBeUndefined();
  });

  it("checks validity", () => {
    expect(isPackageAuthor("Ada <ada@example.dev>")).toBe(true);
    expect(isPackageAuthor("Ada <bad-email>")).toBe(false);
  });

  it("stringifies package person fields conservatively", () => {
    expect(
      stringifyPackageAuthor({
        name: "Ada   Lovelace",
        email: "ada@example.dev",
        url: "https://example.dev"
      })
    ).toBe("Ada Lovelace <ada@example.dev> (https://example.dev)");
    expect(stringifyPackageAuthor(null as never)).toBe("");
  });
});
