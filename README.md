# anti-slop

Opinionated Oxlint rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

Related tooling:

- [Rig](https://github.com/alex-mextner/rig-cli) — a declarative development-environment and engineering-policy reconciler for repositories and developer machines. It manages far more than linting: linters/formatters, CI gates, git and agent hooks, coding-agent skills, MCP servers, harness permissions, repository settings, tool integrations, drift detection, and other development guardrails from global and per-repository policy. [Why use Rig?](#why-rig)
- [agent-tools](https://github.com/alex-mextner/agent-tools) — the reusable catalog behind Rig: coding-agent skills, hooks, CI gates, linter/formatter carriers, MCP/tool integrations, and the pinned anti-slop source Rig can vendor into repositories.

## Install

There are two first-class ways to use anti-slop. **Rig is recommended** when you want one reproducible development policy instead of maintaining lint configuration independently in every repository. See [Why Rig?](#why-rig) for the larger model.

### Option 1 — Rig (recommended)

Preview enabling the anti-slop group:

```bash
rig config set linters.rules.groups.anti-slop true
```

`rig config set` is preview-by-default: it shows the proposed config change and the resulting reconcile plan without writing anything. Commit intentionally:

```bash
rig config set linters.rules.groups.anti-slop true --commit
```

Rig checks the repository-local Oxc toolchain, reconciles the vendored anti-slop carrier from agent-tools, and generates the effective `oxlint.config.ts`. Inspect exactly what is enabled and why:

```bash
rig lint rules
rig lint rules anti-slop/no-known-value-widening
rig lint rules --json
```

The same policy can be declared in `rig.yaml` or in the global Rig config:

```yaml
linters:
  rules:
    groups:
      anti-slop: true

    # `all: true` also enables applicable rules whose Default is off.
    all: false

    # Final per-rule overrides. These win over defaults/groups/all/enable/disable.
    severity:
      anti-slop/no-module-mocking: error
      anti-slop/no-runtime-typeof: off
```

Use the global config for machine-wide defaults and `rig.yaml` for repository-specific differences.

### Option 2 — direct Oxlint

Oxlint supports JavaScript plugins by package/import specifier. Install Oxlint and this repository as a normal package-manager dependency; for pnpm:

```bash
pnpm add -D oxlint "oxlint-plugin-anti-slop@github:alex-mextner/anti-slop"
```

Register the plugin and select severities in `oxlint.config.ts`:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    {
      name: "anti-slop",
      specifier: "oxlint-plugin-anti-slop",
    },
  ],
  rules: {
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "warn",
    "anti-slop/no-runtime-typeof": "off",
  },
});
```

Run the repository-local linter normally:

```bash
pnpm exec oxlint .
```

See the [Oxlint JavaScript plugin documentation](https://oxc.rs/docs/guide/usage/linter/js-plugins) for the underlying Oxc mechanism. This repository is not published as a versioned npm release today, so the GitHub dependency makes the selected source revision part of the package-manager lockfile.

## Rules

The **Rig default** below is the anti-slop portion of Rig's built-in JS/TS policy. There is no separate profile to install: when the anti-slop group is active, Rig uses these audited per-rule defaults, then global policy and repository `rig.yaml` may refine them. `Level` is the severity used when the rule is enabled.

Direct Oxlint users choose their own `"off"`, `"warn"`, or `"error"` values; the `Default` column describes Rig, not an implicit behavior of the plugin itself.

See [Policy and configuration](#policy-and-configuration) for control precedence. Each rule name links to rationale, replacement patterns, examples, and caveats.

| Rule | Default | Level | Summary |
| --- | --- | --- | --- |
| [`no-chained-type-assertions`](docs/rules/no-chained-type-assertions.md) | ✅ on | error | Reject nested assertions that fabricate evidence; preserve the precise type or parse at the boundary. |
| [`no-conditional-empty-object-spread`](docs/rules/no-conditional-empty-object-spread.md) | ❌ off — readability/style choice rather than a general correctness invariant | error | Prefer explicit conditional property construction over spreading `{}` when the repository chooses this style. |
| [`no-known-value-widening`](docs/rules/no-known-value-widening.md) | ✅ on | error | Preserve known value evidence; prefer inference, `satisfies`, or an owner contract. |
| [`no-module-mocking`](docs/rules/no-module-mocking.md) | ✅ on | warn | Prefer dependency injection, adapters, or faithful test implementations to module mocks. |
| [`no-multiple-function-params`](docs/rules/no-multiple-function-params.md) | ❌ off — API-shape preference with legitimate callback/low-level API exceptions | error | Prefer one named request/options object where that improves API ownership and evolution. |
| [`no-object-parameters`](docs/rules/no-object-parameters.md) | ✅ on | error | Prefer named owner types over broad `object` inputs. |
| [`no-optional-function-parameters`](docs/rules/no-optional-function-parameters.md) | ❌ off — frameworks/external signatures can legitimately require positional optional parameters | error | Prefer optional fields in a named request/options object for application-owned APIs. |
| [`no-reflect-apply`](docs/rules/no-reflect-apply.md) | ✅ on | warn | Prefer typed calls or a named interface for dynamic dispatch. |
| [`no-reflect-get`](docs/rules/no-reflect-get.md) | ✅ on | warn | Prefer typed property access or parsed domain values. |
| [`no-runtime-typeof`](docs/rules/no-runtime-typeof.md) | ❌ off — small boundary parsers/type guards may legitimately use `typeof` | error | Strict interior-code rule; prefer decoding external values once and branching on domain values. |
| [`no-shape-in-symbol-names`](docs/rules/no-shape-in-symbol-names.md) | ❌ off — repository-specific naming convention | error | Prefer names that describe domain role/ownership rather than implementation shape. |
| [`no-unknown-parameters`](docs/rules/no-unknown-parameters.md) | ✅ on | warn | Keep `unknown` at explicit parsing boundaries rather than spreading it through interior contracts. |
| [`no-unknown-returns`](docs/rules/no-unknown-returns.md) | ✅ on | error | Parse at the boundary and return a named domain type. |
| [`no-unknown-type-aliases`](docs/rules/no-unknown-type-aliases.md) | ✅ on | error | Do not hide uncertainty behind aliases. |
| [`no-unsafe-dictionary-type`](docs/rules/no-unsafe-dictionary-type.md) | ✅ on | error | Require useful/schema-derived dictionary value contracts. |
| [`no-widen-then-assert`](docs/rules/no-widen-then-assert.md) | ✅ on | error | Reject flows that discard known evidence and later assert it back. |
| [`require-safety-comment-for-type-assertion`](docs/rules/require-safety-comment-for-type-assertion.md) | ✅ on | error | Unavoidable assertions must state the concrete evidence that makes the assertion sound. |

## Policy and configuration

### Rig

The effective rule policy resolves from built-in defaults, applicable group/profile selection, global Rig policy and repository `rig.yaml`; `all`, per-rule `enable`/`disable`, and finally `severity` refine the result. `severity` is the final authority.

```yaml
linters:
  rules:
    # Enable every applicable known policy concept after provider selection/deduplication,
    # including anti-slop rules whose Default column above is off.
    all: true

    enable:
      - anti-slop/no-runtime-typeof
    disable:
      - anti-slop/no-module-mocking

    severity:
      anti-slop/no-reflect-get: error
      anti-slop/no-shape-in-symbol-names: warn
      anti-slop/no-optional-function-parameters: off
```

Use `rig lint rules` to inspect the resolved policy rather than reverse-engineering generated Oxc files.

### Direct Oxlint

Direct Oxlint has no Rig default layer. Configure standard Oxc severities directly:

```ts
export default defineConfig({
  rules: {
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-reflect-get": "warn",
    "anti-slop/no-runtime-typeof": "off",
  },
});
```

### What does `SAFETY:` mean?

Nothing in JavaScript or TypeScript gives `SAFETY:` special meaning. **It is a convention recognized by `require-safety-comment-for-type-assertion`.** The rule sees `value as SomeType` and asks: “TypeScript cannot prove this. What concrete fact makes this assertion sound?” A nearby comment beginning with `SAFETY:` records that proof for the next reader/reviewer/agent.

It is therefore an **assertion audit note**, not a lint-disable switch.

Bad — the cast has no recorded evidence:

```ts
const userId = value as UserId;
```

Bad — a meaningless reassurance technically explains nothing:

```ts
// SAFETY: trust me.
const userId = value as UserId;
```

Good — runtime validation establishes a fact TypeScript cannot represent as a branded type:

```ts
type UserId = string & { readonly __brand: "UserId" };

if (!USER_ID_PATTERN.test(value)) {
  throw new InvalidUserIdError(value);
}

// SAFETY: USER_ID_PATTERN validated `value`; UserId only adds the nominal brand to that validated string.
const userId = value as UserId;
```

Better still: if a parser/type guard can return `UserId` directly, remove the assertion and the `SAFETY:` comment entirely. The rule exists to make the **remaining unavoidable assertions explicit and reviewable**, not to encourage more casts. `as const` is exempt because it narrows a value rather than inventing an unrelated runtime fact.

## Why Rig?

Rig is not a linter wrapper. It treats development practices as declarative, reviewable configuration and reconciles both a repository and the surrounding developer/agent environment to that policy.

For anti-slop specifically, the default Rig baseline currently enables these as **errors**: `no-chained-type-assertions`, `no-known-value-widening`, `no-widen-then-assert`, `no-unsafe-dictionary-type`, `require-safety-comment-for-type-assertion`, `no-object-parameters`, `no-unknown-type-aliases`, and `no-unknown-returns`; enables `no-reflect-get`, `no-reflect-apply`, `no-module-mocking`, and `no-unknown-parameters` as **warnings**; and leaves the five context-sensitive/API-shape rules shown as `❌ off` in the table above disabled until explicitly selected.

The larger reason to use Rig is that the same model applies beyond linting:

- **One development culture.** Global policy establishes machine-wide defaults; committed `rig.yaml` files make repository-specific expectations reproducible. Linters/formatters, CI, git hooks, coding-agent hooks and skills, MCP/tool integrations, harness permissions, repository settings and other guardrails can live under the same control surface.
- **Humans and agents get the same expectations.** Where a harness/tool exposes a preventative hook or permission boundary, Rig can install the guardrail. CI/status/verification provide later enforcement surfaces where prevention is not available. The broader explicit enforcement/advise coverage model is tracked in [Rig #225](https://github.com/alex-mextner/rig-cli/issues/225).
- **Fast onboarding and recovery.** A new checkout can be compared with the desired state and converged instead of rebuilding tribal setup knowledge by hand. A dedicated one-command developer/agent onboarding attestation is tracked in [Rig #228](https://github.com/alex-mextner/rig-cli/issues/228).
- **Useful even for one developer.** The value is not tied to company size: one person with many repositories and multiple coding agents has the same configuration-drift and “why does this agent behave differently here?” problems.
- **Change policy once instead of editing every tool.** Today the global/repository cascade already centralizes many settings. The next layer—one-command multi-repository reconciliation, stack/tag selection, and bulk policy mutation—is tracked in [#222](https://github.com/alex-mextner/rig-cli/issues/222), [#227](https://github.com/alex-mextner/rig-cli/issues/227), and the shared repository registry in [#233](https://github.com/alex-mextner/rig-cli/issues/233).
- **Share the culture across developers/machines.** Versioned shared policy packs, with repository overrides and explicit provenance, are tracked in [#223](https://github.com/alex-mextner/rig-cli/issues/223). Cross-domain `rig rules`/explain—so the same introspection applies to CI, hooks, permissions, skills, MCP and more, not only lint—is tracked in [#224](https://github.com/alex-mextner/rig-cli/issues/224).
- **Prefer better behavior, not just rejection.** The direction is problem → concise safe/preferred alternative → detailed rationale, across lint warnings, hook denials, CI and readiness checks. That generalized recommendation layer is tracked in [#229](https://github.com/alex-mextner/rig-cli/issues/229).

The intended result is that a developer or agent joining a repository does not have to rediscover the team's engineering culture from scattered configs and tribal knowledge. Rig gives that culture a source of truth, a previewable plan, enforcement where the surrounding tools support it, and visible drift when reality stops matching the policy.

## Development

```bash
pnpm install
pnpm check
```

`src/` is canonical. After changing production source or a rule guide, run `pnpm sync:skill-assets`; CI checks that the install payload remains identical.

## Credits and related work

- [Rig](https://github.com/alex-mextner/rig-cli) — declarative repository/machine setup and engineering-policy reconciler spanning lint/format, CI, agent tooling, hooks, permissions, MCP, repository settings and drift.
- [agent-tools](https://github.com/alex-mextner/agent-tools) — reusable skills/hooks/CI/tooling catalog and carrier source consumed by Rig.
- [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) — the original anti-slop repository this fork started from, providing the core low-evidence TypeScript/JavaScript rule-set idea and initial implementations.
- [typeonce-dev/ai-automation](https://github.com/typeonce-dev/ai-automation) — AI-development automation and custom-rule collection used as a pinned reference/catalog when comparing policy concepts and applicability.
- [Oxc / Oxlint](https://github.com/oxc-project/oxc) — the compiler/linter ecosystem and JavaScript-plugin API anti-slop runs on.

## License

MIT
