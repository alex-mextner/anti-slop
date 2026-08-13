# `require-safety-comment-for-type-assertion`

Every non-`const` type assertion must document the checked invariant TypeScript cannot express.

`SAFETY:` is a proof note for the assertion immediately following it. It is not a generic waiver, an eslint-style disable directive, or a substitute for validation. The useful question is: **what concrete fact makes this cast sound, and where was that fact established?**

## Avoid

No evidence is recorded:

```ts
const userId = value as UserId;
```

A generic reassurance is not enough either:

```ts
// SAFETY: this should be fine.
const userId = value as UserId;
```

## Prefer removing the assertion

When a parser, type guard, schema decoder, or more precise upstream type can establish the contract in the type system, return/use that precise type instead of asserting it later.

```ts
const userId = parseUserId(value); // returns UserId or throws
```

## When an assertion is genuinely necessary

State the invariant immediately before the assertion or its containing statement and name the evidence that established it:

```ts
const parsed = parseUserId(value);
if (!parsed.ok) throw new InvalidUserIdError(value);

// SAFETY: parseUserId accepted `value`; UserId is the branded representation of that validated string.
const userId = value as UserId;
```

Library/protocol invariants are another legitimate case when the type declaration cannot encode them:

```ts
const element = document.getElementById("app");
if (!(element instanceof HTMLDivElement)) throw new Error("#app must be a div");

// SAFETY: the instanceof check above proves this exact DOM node is an HTMLDivElement.
const app = element as HTMLDivElement;
```

The comment should therefore identify a specific runtime check, parser/schema result, protocol guarantee, construction invariant, or library guarantee. If you cannot state such evidence precisely, the assertion is probably hiding missing validation or an imprecise upstream type.

`as const` is intentionally exempt because it narrows a value rather than asserting an unrelated runtime contract.
