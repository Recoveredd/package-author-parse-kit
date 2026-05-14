# package-author-parse-kit

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/Recoveredd/package-author-parse-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/package-author-parse-kit/actions/workflows/ci.yml)

Parse package author, maintainer, and contributor strings into structured fields with diagnostics.

## Demo

Try the browser preview: [packages.wasta-wocket.fr/package-author-parse-kit](https://packages.wasta-wocket.fr/package-author-parse-kit/).

## Package quality

- TypeScript types are generated from the source.
- ESM-only package with no runtime dependencies.
- Marked as side-effect free for bundlers.
- CI runs `npm ci`, `typecheck`, `build`, and `test`.
- Tested on Node.js 20 and 22 with GitHub Actions.
- Browser-friendly implementation with no Node-only APIs.

## Install

```bash
npm install package-author-parse-kit
```

## Usage

```ts
import { parsePackageAuthor } from "package-author-parse-kit";

const result = parsePackageAuthor("Ada Lovelace <ada@example.dev> (https://example.dev)");

if (result.ok) {
  result.author.name;
  result.author.email;
  result.author.url;
}
```

Invalid input returns stable issue codes instead of throwing:

```ts
const result = parsePackageAuthor("Ada <not-an-email>");

result.ok; // false
result.issues[0]?.code; // "invalid-email"
```

Non-string runtime values are rejected with `invalid-input` instead of being coerced into names. Runtime-invalid options return an `invalid-options` diagnostic rather than throwing.

## API

### `parsePackageAuthor(input, options?)`

Returns a discriminated result with:

- `author`: parsed `name`, `email`, and `url` fields.
- `tokens`: field tokens with source offsets.
- `issues`: stable diagnostics when parsing fails.

### `packageAuthorOrUndefined(input, options?)`

Returns the parsed author object, or `undefined` when validation fails.

### `isPackageAuthor(input, options?)`

Returns `true` when the string can be parsed without diagnostics.

### `stringifyPackageAuthor(author)`

Formats an object as `Name <email> (url)`.

## Options

- `maxInputLength`: reject long input before scanning. Default: `500`.
- `requireKnownField`: reject input that does not produce any known field. Default: `false`.
- `allowBareUrl`: parse a bare `https://`, `http://`, or `mailto:` value as a URL. When disabled, a bare URL returns a `bare-url-disabled` diagnostic instead of being treated as a name. Default: `true`.

## Supported Inputs

- `Name`
- `Name <email@example.dev>`
- `Name (https://example.dev)`
- `Name <email@example.dev> (https://example.dev)`
- `Name (https://example.dev) <email@example.dev>`
- `<email@example.dev>`
- `(https://example.dev)`
- `https://example.dev`

## Browser Compatibility

The core parser uses only strings, arrays, regular expressions, and plain objects. It has no runtime dependencies and does not use Node APIs.

## CLI

No CLI is included in this draft. The natural use case is package metadata validation inside applications, build tools, and browser-based package editors.
