# anti-slop

Opinionated Oxlint rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

This fork is the Rig/agent-tools anti-slop source. It is meant to be vendored into target repositories rather than consumed as a fixed npm dependency. Rig owns rule selection and severity; the vendored plugin only supplies implementations.

## Install

Rig-managed repositories should enable the anti-slop rule group in `rig.yaml` or the global Rig config. Rig vendors the plugin and renders the resulting Oxlint configuration.

Manual installation is still possible: copy `src/` into the target repository (for example `tools/oxlint/anti-slop/`), install compatible `oxlint` and `@oxlint/plugins`, register the local plugin, and explicitly choose rule severities.

> [!IMPORTANT]
> Vendoring anti-slop does **not** imply that every rule is enabled. Rule activation is a policy decision. Rig keeps that decision in configuration so global defaults and per-repository overrides remain visible and reproducible.

## Rules

> [!TIP]
> Each rule links to a short guide with rationale, replacement patterns, examples, and semantic caveats. Lint diagnostics also include the guide path so a human or coding agent can jump from the error to the full rule without duplicating the whole guide in every message.

- [`no-chained-type-assertions`](docs/rules/no-chained-type-assertions.md) — rejects nested type assertions that fabricate evidence. **Prefer:** keep the original precise type, or parse untrusted input at its boundary before narrowing it.
- [`no-conditional-empty-object-spread`](docs/rules/no-conditional-empty-object-spread.md) — rejects conditional spreads that use `{}` to omit fields. **Prefer:** build the object explicitly and add the property only when present.
- [`no-known-value-widening`](docs/rules/no-known-value-widening.md) — rejects explicit broad target types that discard known value evidence. **Prefer:** preserve inference, use `satisfies`, or use a named owner contract.
- [`no-module-mocking`](docs/rules/no-module-mocking.md) — rejects Vitest and Jest module mocks. **Prefer:** dependency injection through a real interface, service layer, adapter, or faithful test implementation.
- [`no-object-parameters`](docs/rules/no-object-parameters.md) — rejects the broad `object` type on function inputs. **Prefer:** accept a named owner type and parse external input at the boundary.
- [`no-reflect-apply`](docs/rules/no-reflect-apply.md) — rejects `Reflect.apply`. **Prefer:** typed function calls or a named interface for dynamic dispatch.
- [`no-reflect-get`](docs/rules/no-reflect-get.md) — rejects `Reflect.get`. **Prefer:** typed property access, or parse dynamic input into a named domain type first.
- [`no-runtime-typeof`](docs/rules/no-runtime-typeof.md) — rejects ad hoc `typeof` narrowing. **Prefer:** decode external values at the I/O boundary, then branch on domain values. This rule is intentionally suitable for opt-in/strict profiles rather than a universal default because small boundary parsers may legitimately use `typeof`.
- [`no-shape-in-symbol-names`](docs/rules/no-shape-in-symbol-names.md) — rejects `shape` in symbol names. **Prefer:** name symbols for their domain role or ownership. This is an opinionated naming rule and is not a universal default.
- [`no-unknown-parameters`](docs/rules/no-unknown-parameters.md) — rejects `unknown` inputs except the explicit `cause` convention. **Prefer:** accept a named domain type after the expected schema/parser has run at the boundary. Boundary adapters may reasonably keep this rule disabled or downgraded.
- [`no-unknown-returns`](docs/rules/no-unknown-returns.md) — rejects function contracts that return `unknown` or `Promise<unknown>`. **Prefer:** parse at the boundary and return a named domain type.
- [`no-unknown-type-aliases`](docs/rules/no-unknown-type-aliases.md) — rejects aliases that merely conceal `unknown`. **Prefer:** keep `unknown` visible at an allowed parsing boundary, then use the parsed owner type.
- [`no-unsafe-dictionary-type`](docs/rules/no-unsafe-dictionary-type.md) — rejects dictionary value contracts based on `unknown`, `any`, `object`, `{}`, and semantic equivalents. **Prefer:** an owner/schema-derived value type and parsed external payloads.
- [`no-widen-then-assert`](docs/rules/no-widen-then-assert.md) — rejects local flows that widen known values and later assert them back. **Prefer:** keep the precise type from initialization through use and parse boundary input once.
- [`require-safety-comment-for-type-assertion`](docs/rules/require-safety-comment-for-type-assertion.md) — requires each non-const assertion to document its checked invariant. **Prefer:** remove the assertion when possible; otherwise state the specific `SAFETY:` invariant immediately before it.

## Recommended Rig baseline

The fork deliberately ships more rules than the default profile enables. A sensible baseline is:

| Rule | Default | Rationale |
| --- | --- | --- |
| `no-chained-type-assertions` | error | catches assertion laundering |
| `no-known-value-widening` | error | preserves known type evidence |
| `no-widen-then-assert` | error | catches evidence loss followed by reconstruction |
| `no-unsafe-dictionary-type` | error | rejects contracts whose values carry no useful type evidence |
| `require-safety-comment-for-type-assertion` | error | documents unavoidable assertions |
| `no-object-parameters` | error | keeps function contracts concrete |
| `no-unknown-type-aliases` | error | prevents hiding uncertainty behind aliases |
| `no-unknown-returns` | error | keeps uncertainty at boundaries |
| `no-reflect-get` | warn | useful smell; dynamic APIs can be legitimate |
| `no-reflect-apply` | warn | useful smell; dynamic dispatch can be legitimate |
| `no-module-mocking` | warn | promotes real seams without making every test architecture identical |
| `no-unknown-parameters` | warn | strong interior-code signal, but boundary adapters exist |
| `no-runtime-typeof` | off | boundary parsers may legitimately use `typeof` |
| `no-conditional-empty-object-spread` | off | readability/style choice rather than a correctness invariant |
| `no-shape-in-symbol-names` | off | repository-specific naming policy |

Projects can enable all rules and then disable/downgrade selected rules, or start from the baseline and opt into stricter groups. Rig is the source of truth for those choices.

## Development

```bash
pnpm install
pnpm check
```

`src/` is canonical. After changing production source, run `pnpm sync:skill-assets`; CI checks that the skill's bundled copy remains identical.

## License

MIT
