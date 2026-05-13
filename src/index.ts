export type AuthorIssueCode =
  | "empty-input"
  | "input-too-long"
  | "unclosed-email"
  | "unclosed-url"
  | "duplicate-email"
  | "duplicate-url"
  | "invalid-email"
  | "invalid-url"
  | "bare-url-disabled"
  | "unexpected-token";

export interface AuthorIssue {
  code: AuthorIssueCode;
  message: string;
  index: number;
}

export interface PackageAuthor {
  name?: string;
  email?: string;
  url?: string;
}

export interface AuthorToken {
  kind: "name" | "email" | "url";
  value: string;
  start: number;
  end: number;
}

export interface ParseAuthorOptions {
  maxInputLength?: number;
  requireKnownField?: boolean;
  allowBareUrl?: boolean;
}

export type ParseAuthorResult =
  | {
      ok: true;
      input: string;
      author: PackageAuthor;
      tokens: AuthorToken[];
      issues: [];
    }
  | {
      ok: false;
      input: string;
      author: PackageAuthor;
      tokens: AuthorToken[];
      issues: AuthorIssue[];
    };

const DEFAULT_MAX_INPUT_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@<>()[\]]+@[^\s@<>()[\]]+\.[^\s@<>()[\]]+$/u;

const URL_PATTERN = /^(?:https?:\/\/|mailto:)[^\s()<>]+$/iu;

export function parsePackageAuthor(input: string, options: ParseAuthorOptions = {}): ParseAuthorResult {
  const maxInputLength = options.maxInputLength ?? DEFAULT_MAX_INPUT_LENGTH;
  const source = String(input);
  const tokens: AuthorToken[] = [];
  const issues: AuthorIssue[] = [];
  const author: PackageAuthor = {};

  if (source.length > maxInputLength) {
    issues.push(issue("input-too-long", "Input exceeds the configured maximum length.", maxInputLength));
    return failure(source, author, tokens, issues);
  }

  const trimmed = source.trim();
  if (trimmed.length === 0) {
    issues.push(issue("empty-input", "Input is empty.", 0));
    return failure(source, author, tokens, issues);
  }

  const remaining = source.split("");
  extractDelimited(source, remaining, "<", ">", "email", author, tokens, issues);
  extractDelimited(source, remaining, "(", ")", "url", author, tokens, issues);

  const remainingText = remaining.join("");
  const bare = remainingText.trim();
  if (bare.length > 0) {
    const start = firstNonSpaceIndex(remainingText);
    const end = lastNonSpaceIndex(remainingText) + 1;
    if (looksLikeUrl(bare) && options.allowBareUrl !== false) {
      setUrl(bare, start, end, author, tokens, issues);
    } else if (looksLikeUrl(bare)) {
      issues.push(issue("bare-url-disabled", "Bare URL parsing is disabled.", start));
    } else if (bare.includes("@") && !author.email && !/[()\s]/u.test(bare)) {
      setEmail(bare, start, end, author, tokens, issues);
    } else {
      const cleanName = normalizeSpacing(bare);
      if (cleanName.length > 0) {
        author.name = cleanName;
        tokens.push({ kind: "name", value: cleanName, start, end });
      }
    }
  }

  if (author.email && !EMAIL_PATTERN.test(author.email)) {
    const token = tokens.find((item) => item.kind === "email");
    issues.push(issue("invalid-email", "Email does not look like a package person email.", token?.start ?? 0));
  }

  if (author.url && !URL_PATTERN.test(author.url)) {
    const token = tokens.find((item) => item.kind === "url");
    issues.push(issue("invalid-url", "URL must use http, https, or mailto.", token?.start ?? 0));
  }

  if (options.requireKnownField === true && !author.name && !author.email && !author.url) {
    issues.push(issue("unexpected-token", "Input did not contain a name, email, or URL.", 0));
  }

  if (issues.length > 0) {
    return failure(source, author, tokens, issues);
  }

  return {
    ok: true,
    input: source,
    author,
    tokens,
    issues: []
  };
}

export function packageAuthorOrUndefined(input: string, options?: ParseAuthorOptions): PackageAuthor | undefined {
  const result = parsePackageAuthor(input, options);
  return result.ok ? result.author : undefined;
}

export function isPackageAuthor(input: string, options?: ParseAuthorOptions): boolean {
  return parsePackageAuthor(input, options).ok;
}

export function stringifyPackageAuthor(author: PackageAuthor): string {
  const parts: string[] = [];
  if (author.name) {
    parts.push(normalizeSpacing(author.name));
  }
  if (author.email) {
    parts.push(`<${author.email.trim()}>`);
  }
  if (author.url) {
    parts.push(`(${author.url.trim()})`);
  }
  return parts.join(" ");
}

function extractDelimited(
  source: string,
  remaining: string[],
  open: "<" | "(",
  close: ">" | ")",
  kind: "email" | "url",
  author: PackageAuthor,
  tokens: AuthorToken[],
  issues: AuthorIssue[]
): void {
  let openIndex = source.indexOf(open);

  while (openIndex !== -1) {
    const closeIndex = source.indexOf(close, openIndex + 1);

    if (closeIndex === -1) {
      issues.push(issue(kind === "email" ? "unclosed-email" : "unclosed-url", `Missing closing ${close}.`, openIndex));
      remaining[openIndex] = " ";
      return;
    }

    const rawValue = source.slice(openIndex + 1, closeIndex);
    const value = rawValue.trim();
    const leadingWhitespace = rawValue.search(/\S/u);
    const tokenStart = leadingWhitespace === -1 ? openIndex + 1 : openIndex + 1 + leadingWhitespace;

    if (kind === "email") {
      setEmail(value, tokenStart, tokenStart + value.length, author, tokens, issues);
    } else {
      setUrl(value, tokenStart, tokenStart + value.length, author, tokens, issues);
    }

    for (let index = openIndex; index <= closeIndex; index += 1) {
      remaining[index] = " ";
    }

    openIndex = source.indexOf(open, closeIndex + 1);
  }

  for (let index = 0; index < remaining.length; index += 1) {
    if (remaining[index] === close) {
      issues.push(issue("unexpected-token", `Unexpected ${close}.`, index));
      remaining[index] = " ";
    }
  }
}

function setEmail(
  value: string,
  start: number,
  end: number,
  author: PackageAuthor,
  tokens: AuthorToken[],
  issues: AuthorIssue[]
): void {
  if (author.email) {
    issues.push(issue("duplicate-email", "Only one email is supported.", start));
    return;
  }
  author.email = value;
  tokens.push({ kind: "email", value, start, end });
}

function setUrl(
  value: string,
  start: number,
  end: number,
  author: PackageAuthor,
  tokens: AuthorToken[],
  issues: AuthorIssue[]
): void {
  if (author.url) {
    issues.push(issue("duplicate-url", "Only one URL is supported.", start));
    return;
  }
  author.url = value;
  tokens.push({ kind: "url", value, start, end });
}

function looksLikeUrl(value: string): boolean {
  return /^(?:https?:\/\/|mailto:)/iu.test(value);
}

function normalizeSpacing(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function firstNonSpaceIndex(value: string): number {
  const index = value.search(/\S/u);
  return index === -1 ? 0 : index;
}

function lastNonSpaceIndex(value: string): number {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (!/\s/u.test(value[index] ?? "")) {
      return index;
    }
  }
  return 0;
}

function issue(code: AuthorIssueCode, message: string, index: number): AuthorIssue {
  return { code, message, index: Math.max(0, index) };
}

function failure(input: string, author: PackageAuthor, tokens: AuthorToken[], issues: AuthorIssue[]): ParseAuthorResult {
  return {
    ok: false,
    input,
    author,
    tokens,
    issues
  };
}
