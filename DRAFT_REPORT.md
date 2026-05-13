# Draft Report: package-author-parse-kit

## Verdict

GO local draft, recommended for human review before any publication decision.

## Candidate

- Abandoned signal package: `parse-author`
- Latest version: `2.0.0`
- Last package version publish: 2017-03-08
- npm metadata modified: 2022-06-23
- License: MIT
- Runtime dependency: `author-regex`
- Scope: parse npm-style person strings into name, email, and URL fields.

## Score

- Usage actuel vérifié: 1.5/2. The README and npm metadata target package authors, contributors, maintainers, and AUTHORS files; npm search/download API was unreliable in this sandbox, so usage is treated as plausible but not fully proven by download count.
- Abandon ou maintenance faible: 2/2. Latest version was published in 2017 and the README still references Travis-era generated docs.
- Scope livrable en 1 journée: 2/2. A compact parser, formatter, options, and tests fit comfortably.
- Douleur utilisateur visible: 1.5/2. Package metadata editors and validation tools need stable handling of person fields without throws.
- Différenciation non triviale: 2/2. Structured diagnostics, source tokens, browser-friendly zero-dependency core, and conservative validation are visible immediately.

Total: 9/10.

## Différenciation en 1 journée

`package-author-parse-kit` returns stable diagnostic codes and source tokens for package person strings, so a package editor can highlight invalid emails, duplicate fields, or malformed URLs without catching exceptions.

## Alternatives

- `normalize-package-data`: actively maintained and broader, but it normalizes entire package manifests rather than offering a tiny browser-friendly field parser with diagnostics.
- `author-regex`: old helper regex, not a complete diagnostic parser.
- `parse-author`: abandoned signal package; the draft does not copy its code, README, tests, or regex.

No recent small leader was identified that makes this draft an obvious duplicate.

## Name

Retained name: `package-author-parse-kit`.

The name is explicit in npm/GitHub lists: it says this is for package author fields, it says the action is parsing, and it follows the `*-kit` convention. It is not confusingly close to `parse-author`.

## Browser-Friendly Justification

The core library uses only ECMAScript strings, arrays, regular expressions, and objects. It has no runtime dependencies and no Node-only APIs such as `fs`, `path`, `Buffer`, `process`, native modules, or network access.

## CLI Decision

No CLI was added. A CLI would be marginal for this scope; the natural use case is validation inside package editors, build tools, forms, and browser-based metadata UIs.

## Proposed API

- `parsePackageAuthor(input, options?)`
- `packageAuthorOrUndefined(input, options?)`
- `isPackageAuthor(input, options?)`
- `stringifyPackageAuthor(author)`

## Risks and Limits

- The parser intentionally supports one name, one email, and one URL.
- It does not attempt full RFC email validation.
- It does not parse multiple authors from a single line.
- Download count evidence could not be collected via the npm downloads endpoint from this sandbox.

## Missing Before Publication

- Confirm current npm download counts from a network environment.
- Test against a sample of real package manifests.
- Decide whether to support multiple people in one string.
- Review package name availability again immediately before publication.

## Local Git State

- `git init`: OK.
- `git branch -M main`: OK after local review.
- `git config user.name "Recoveredd"`: OK.
- `git config user.email "recoveredd@users.noreply.github.com"`: OK.
- `git add .`: OK.
- `git commit -m "Create package-author-parse-kit draft"`: OK after local review.
- Current local commit exists with message `Create package-author-parse-kit draft`.
- No remote was added.

The parent workspace Git state was not touched by the draft Git repository.

## Review Fixes Applied

- `allowBareUrl: false` now rejects bare URL input with a `bare-url-disabled` diagnostic instead of silently treating it as a name.
- Source spans now stay non-negative when unexpected closing delimiters are present.
- README option wording was updated for `allowBareUrl`.

## Validation Commands

- `npm install`: OK.
- `npm run typecheck`: OK.
- `npm test`: OK, 13 tests passed after local review fixes.
- `npm run build`: OK.
- `npm pack --dry-run`: failed with the default user npm cache because `/Users/guillaumepapinutti/.npm` contains root-owned files.
- `npm_config_cache=/private/tmp/package-author-parse-kit-npm-cache npm pack --dry-run`: OK, tarball preview contains 8 files and unpacked size is 32.5 kB.
