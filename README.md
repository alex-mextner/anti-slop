# anti-slop

[![skills.sh](https://skills.sh/b/dmmulroy/anti-slop)](https://skills.sh/dmmulroy/anti-slop)

Opinionated Oxlint rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

This project is meant to be vendored, not treated as a fixed npm dependency. Copy the rules into your repository, read them, and change them to match your team's standards. The bundled agent skill handles the initial copy and configuration; after that, the vendored files are yours to maintain and make your own.

## Install with an agent skill

```bash
npx skills add dmmulroy/anti-slop --skill install-anti-slop
```

Then ask your coding agent to install or configure anti-slop in the current repository. The skill copies the plugin, installs current Oxlint dependencies, merges the plugin into the existing lint configuration, enables every rule, and validates the result.

To inspect available skills first:

```bash
npx skills add dmmulroy/anti-slop --list
```

## Manual local installation

Copy `src/` into the target repository, for example at `tools/oxlint/anti-slop/`, and install matching current versions of `oxlint` and `@oxlint/plugins`.

Register the copied entry point in `oxlint.config.ts`:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
  ],
  rules: {
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": "error",
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error"
  }
});
```

The same `jsPlugins` entry and rules work under `lint` in a Vite+ config.

## Rules

Each rule links to a short guide with rationale, replacement patterns, and semantic caveats.

- [`no-chained-type-assertions`](docs/rules/no-chained-type-assertions.md) — rejects nested type assertions that fabricate evidence. **Prefer:** keep the original precise type, or parse untrusted input at its boundary before narrowing it.
- [`no-conditional-empty-object-spread`](docs/rules/no-conditional-empty-object-spread.md) — rejects conditional spreads that use `{}` to omit fields. **Prefer:** build the object explicitly and add the property only when present.
- [`no-known-value-widening`](docs/rules/no-known-value-widening.md) — rejects explicit broad target types that discard known value evidence. **Prefer:** preserve inference, use `satisfies`, or use a named owner contract.
- [`no-module-mocking`](docs/rules/no-module-mocking.md) — rejects Vitest and Jest module mocks. **Prefer:** dependency injection through a real interface, service layer, adapter, or faithful test implementation.
- [`no-object-parameters`](docs/rules/no-object-parameters.md) — rejects the broad `object` type on function inputs. **Prefer:** accept a named owner type and parse external input at the boundary.
- [`no-reflect-apply`](docs/rules/no-reflect-apply.md) — rejects `Reflect.apply`. **Prefer:** typed function calls or a named interface for dynamic dispatch.
- [`no-reflect-get`](docs/rules/no-reflect-get.md) — rejects `Reflect.get`. **Prefer:** typed property access, or parse dynamic input into a named domain type first.
- [`no-runtime-typeof`](docs/rules/no-runtime-typeof.md) — rejects ad hoc `typeof` narrowing. **Prefer:** decode external values at the I/O boundary, then branch on domain values.
- [`no-shape-in-symbol-names`](docs/rules/no-shape-in-symbol-names.md) — rejects `shape` in symbol names. **Prefer:** name symbols for their domain role or ownership.
- [`no-unknown-parameters`](docs/rules/no-unknown-parameters.md) — rejects `unknown` inputs except the explicit `cause` convention. **Prefer:** accept a named domain type after the expected schema/parser has run at the boundary.
- [`no-unknown-returns`](docs/rules/no-unknown-returns.md) — rejects function contracts that return `unknown` or `Promise<unknown>`. **Prefer:** parse at the boundary and return a named domain type.
- [`no-unknown-type-aliases`](docs/rules/no-unknown-type-aliases.md) — rejects aliases that merely conceal `unknown`. **Prefer:** keep `unknown` visible at an allowed parsing boundary, then use the parsed owner type.
- [`no-unsafe-dictionary-type`](docs/rules/no-unsafe-dictionary-type.md) — rejects dictionary value contracts based on `unknown`, `any`, `object`, `{}`, and semantic equivalents. **Prefer:** an owner/schema-derived value type and parsed external payloads.
- [`no-widen-then-assert`](docs/rules/no-widen-then-assert.md) — rejects local flows that widen known values and later assert them back. **Prefer:** keep the precise type from initialization through use and parse boundary input once.
- [`require-safety-comment-for-type-assertion`](docs/rules/require-safety-comment-for-type-assertion.md) — requires each non-const assertion to document its checked invariant. **Prefer:** remove the assertion when possible; otherwise state the specific `SAFETY:` invariant immediately before it.

## Violation examples

Each snippet below is rejected by the named rule.

### `no-chained-type-assertions`

```ts
const user = input as object as User;
```

### `no-conditional-empty-object-spread`

```ts
const options = {
  ...(timeout !== undefined ? { timeout } : {}),
};
```

### `no-known-value-widening`

```ts
const handlers: Record<string, Handler> = {
  start: startHandler,
};
```

This discards the known `start` key. Preserve inference or use `satisfies Record<string, Handler>` instead.

### `no-module-mocking`

```ts
vi.mock("./user-store");
```

### `no-object-parameters`

```ts
function save(value: object) {}
```

### `no-reflect-apply`

```ts
const value = Reflect.apply(operation, owner, args);
```

### `no-reflect-get`

```ts
const value = Reflect.get(owner, key);
```

### `no-runtime-typeof`

```ts
if (typeof input === "string") {
  useName(input);
}
```

### `no-shape-in-symbol-names`

```ts
interface UserShape {
  id: string;
}
```

### `no-unknown-parameters`

```ts
function handle(input: unknown) {}
```

### `no-unknown-returns`

```ts
function loadUser(): unknown {
  return input;
}
```

### `no-unknown-type-aliases`

```ts
type ExternalValue = unknown;
```

### `no-unsafe-dictionary-type`

```ts
type Metadata = Record<string, unknown>;
type OtherMetadata = { [key: string]: object };
```

### `no-widen-then-assert`

```ts
const loaded: User = loadUser();
const stored: unknown = loaded;
const user = stored as User;
```

### `require-safety-comment-for-type-assertion`

```ts
const userId = value as UserId;
```

Add a specific justification immediately before a necessary assertion:

```ts
// SAFETY: parseUserId validated the identifier before branding it.
const userId = value as UserId;
```

## Development

```bash
pnpm install
pnpm check
```

`src/` is canonical. After changing production source, run `pnpm sync:skill-assets`; CI checks that the skill's bundled copy remains identical.

## License

MIT
