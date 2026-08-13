# anti-slop

Opinionated Oxlint rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

anti-slop is used by three related repositories:

- [Rig](https://github.com/alex-mextner/rig-cli) — declarative repository setup and reconciliation; selects rules, resolves defaults/overrides, and generates the effective Oxlint configuration.
- [agent-tools](https://github.com/alex-mextner/agent-tools) — reusable coding-agent skills, hooks, CI gates, linter/formatter carriers, and the pinned anti-slop source consumed by Rig.
- [anti-slop](https://github.com/alex-mextner/anti-slop) — the Oxlint plugin implementations and rule documentation in this repository.

## Install

There are two supported ways to use anti-slop. **Rig is recommended** when the repository already uses Rig because it keeps the selected policy reproducible across repositories and machines. Direct Oxc setup is a first-class option when you want to manage Oxlint yourself.

### Option 1 — Rig (recommended for Rig-managed repositories)

From the target repository:

```bash
rig config set linters.rules.groups.anti-slop true
rig apply commit
```

Rig checks the repository-local Oxc toolchain, installs/reconciles the vendored anti-slop carrier from agent-tools, and renders the effective `oxlint.config.ts`. Inspect the resolved policy at any time:

```bash
rig lint rules
rig lint rules anti-slop/no-known-value-widening
rig lint rules --json
```

The same policy can be declared directly in `rig.yaml`:

```yaml
linters:
  rules:
    groups:
      anti-slop: true
    # `all: true` additionally enables applicable rules whose Default is off.
    # Final per-rule override; this wins over defaults, groups, all, enable and disable.
    severity:
      anti-slop/no-module-mocking: error
      anti-slop/no-runtime-typeof: off
```

Use the global Rig config instead when you want the same baseline on every repository, then override only exceptions in repository `rig.yaml`.

### Option 2 — direct Oxc setup

Use the normal package-manager/Oxlint workflow and keep the plugin as a local package dependency. For pnpm:

```bash
pnpm add -D oxlint @oxlint/plugins
pnpm add -D oxlint-plugin-anti-slop@github:alex-mextner/anti-slop
```

Then register it in `oxlint.config.ts` and select severities explicitly:

```ts
import { defineConfig } from "oxlint";
import antiSlop from "oxlint-plugin-anti-slop";

export default defineConfig({
  jsPlugins: [{ name: "anti-slop", specifier: "oxlint-plugin-anti-slop" }],
  rules: {
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "warn",
    "anti-slop/no-runtime-typeof": "off",
  },
});
```

Run it through the repository-local binary as usual:

```bash
pnpm oxlint .
```

The package is intentionally not published as a versioned npm release today; the GitHub dependency keeps the exact source revision visible in the lockfile. Rig uses its pinned agent-tools source instead.

## Rules

The **Rig default policy** is the built-in JS/TS policy Rig applies when lint policy is enabled for an applicable repository. You do not install a separate “profile”: Rig resolves it automatically, then global config and `rig.yaml` may override it. `Default` below is that Rig default. `Level` is the severity when the rule is on. Rules with `Default: off` remain available and are enabled by `linters.rules.all: true`, an applicable group/profile, `enable`, or an explicit `severity` override.

Direct Oxc users have no implicit Rig defaults: put the desired `"off"`, `"warn"`, or `"error"` value in `rules` themselves.

See [Policy and configuration](#policy-and-configuration) for precedence and concrete Rig/Oxc examples. Each rule name links to its detailed rationale, replacement patterns, examples, and caveats.

| Rule | Default | Level | Summary |
| --- | --- | --- | --- |
| [`no-chained-type-assertions`](docs/rules/no-chained-type-assertions.md) | on | error | Reject nested assertions that fabricate evidence; preserve the precise type or parse at the boundary. |
| [`no-conditional-empty-object-spread`](docs/rules/no-conditional-empty-object-spread.md) | off | error | Prefer explicit conditional property construction over spreading `{}`. |
| [`no-known-value-widening`](docs/rules/no-known-value-widening.md) | on | error | Preserve known value evidence; prefer inference, `satisfies`, or an owner contract. |
| [`no-module-mocking`](docs/rules/no-module-mocking.md) | on | warn | Prefer dependency injection, adapters, or faithful test implementations to module mocks. |
| [`no-multiple-function-params`](docs/rules/no-multiple-function-params.md) | off | error | Opinionated API-shape rule: prefer one named request/options object. |
| [`no-object-parameters`](docs/rules/no-object-parameters.md) | on | error | Prefer named owner types over broad `object` inputs. |
| [`no-optional-function-parameters`](docs/rules/no-optional-function-parameters.md) | off | error | Opinionated API-shape rule: prefer optional fields in a named request/options object. |
| [`no-reflect-apply`](docs/rules/no-reflect-apply.md) | on | warn | Prefer typed calls or a named interface for dynamic dispatch. |
| [`no-reflect-get`](docs/rules/no-reflect-get.md) | on | warn | Prefer typed property access or parsed domain values. |
| [`no-runtime-typeof`](docs/rules/no-runtime-typeof.md) | off | error | Strict rule; boundary parsers can legitimately need `typeof`. |
| [`no-shape-in-symbol-names`](docs/rules/no-shape-in-symbol-names.md) | off | error | Opinionated naming policy: name symbols for domain role/ownership. |
| [`no-unknown-parameters`](docs/rules/no-unknown-parameters.md) | on | warn | Keep `unknown` at explicit parsing boundaries rather than interior contracts. |
| [`no-unknown-returns`](docs/rules/no-unknown-returns.md) | on | error | Parse at the boundary and return a named domain type. |
| [`no-unknown-type-aliases`](docs/rules/no-unknown-type-aliases.md) | on | error | Do not hide uncertainty behind aliases. |
| [`no-unsafe-dictionary-type`](docs/rules/no-unsafe-dictionary-type.md) | on | error | Require useful/schema-derived dictionary value contracts. |
| [`no-widen-then-assert`](docs/rules/no-widen-then-assert.md) | on | error | Reject flows that discard known evidence and later assert it back. |
| [`require-safety-comment-for-type-assertion`](docs/rules/require-safety-comment-for-type-assertion.md) | on | error | Unavoidable assertions must state the checked invariant immediately before the assertion. |

## Policy and configuration

### Rig

The effective order is: built-in defaults → applicable group/profile selection → global Rig config → repository `rig.yaml` → `all` → per-rule `enable`/`disable` → per-rule `severity` as the final authority.

Examples:

```yaml
linters:
  rules:
    # Enable every applicable known policy concept after provider deduplication,
    # including anti-slop rules whose Default column above is off.
    all: true

    # Individual switches are useful for small exceptions.
    enable:
      - anti-slop/no-runtime-typeof
    disable:
      - anti-slop/no-module-mocking

    # Final severity overrides win over everything above.
    severity:
      anti-slop/no-reflect-get: error
      anti-slop/no-shape-in-symbol-names: warn
      anti-slop/no-optional-function-parameters: off
```

Use `rig lint rules` to see the resolved result rather than inferring it from generated files.

### Direct Oxlint

Oxlint has no knowledge of Rig defaults. Configure each rule with standard Oxc severity values:

```ts
export default defineConfig({
  rules: {
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-reflect-get": "warn",
    "anti-slop/no-runtime-typeof": "off",
  },
});
```

### `SAFETY:` comments

`require-safety-comment-for-type-assertion` uses `SAFETY:` as a focused proof attached to an assertion that TypeScript cannot establish. It is **not** a generic lint-disable comment and it does not make an unsafe assertion acceptable by itself.

Bad — no evidence:

```ts
const userId = value as UserId;
```

Also bad — generic waiver:

```ts
// SAFETY: this should be fine.
const userId = value as UserId;
```

Good — name the concrete checked invariant and where it came from:

```ts
const parsed = parseUserId(value);
if (!parsed.ok) throw new InvalidUserIdError(value);

// SAFETY: parseUserId accepted `value`; UserId is the branded representation of that validated string.
const userId = value as UserId;
```

Prefer removing the assertion entirely when the parser/type guard can return the precise type. `as const` is exempt because it narrows a value instead of asserting an unrelated runtime contract.

## Development

```bash
pnpm install
pnpm check
```

`src/` is canonical. After changing production source or a rule guide, run `pnpm sync:skill-assets`; CI checks that the install payload remains identical.

## Credits and related work

- [Rig](https://github.com/alex-mextner/rig-cli) — declarative dev-environment and policy reconciler; owns applicability, rule selection, severity, and generated target configuration in Rig-managed repositories.
- [agent-tools](https://github.com/alex-mextner/agent-tools) — reusable agent tooling catalog and pinned carrier source used by Rig; vendors anti-slop and supplies the surrounding Oxc integration.
- [typeonce-dev/ai-automation](https://github.com/typeonce-dev/ai-automation) — upstream AI-development automation/rule collection that informed part of the rule inventory and applicability analysis. Its implementations are treated as reference material where licensing/provider selection prevents direct reuse.

Thanks to the original anti-slop work this repository was forked from and to the broader Oxc/Oxlint ecosystem that makes local JavaScript lint plugins possible.

## License

MIT
