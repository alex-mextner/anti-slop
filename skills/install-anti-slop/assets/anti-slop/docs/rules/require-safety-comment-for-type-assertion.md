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

State the invariant immediately before the assertion or its containing statement and name the evidence that established it. Branding after an external validator is a typical case when the validator's boolean result does not itself change the TypeScript type:

```ts
type UserId = string & { readonly __brand: "UserId" };

if (!userIdSchema.safeParse(value).success) {
  throw new InvalidUserIdError(value);
}

// SAFETY: userIdSchema accepted `value`; UserId is the branded representation of that validated string.
const userId = value as UserId;
```

Protocol/library invariants can also justify an assertion when their runtime guarantee is stronger than the available declaration:

```ts
const decoded = protocol.decode(frame);
if (!decoded.valid) throw new InvalidFrameError();

// SAFETY: protocol.decode validated the payload against MessageV2; the library exposes payload as object.
const message = decoded.payload as MessageV2;
```

The comment should therefore identify a specific runtime check, parser/schema result, protocol guarantee, construction invariant, or library guarantee. If you cannot state such evidence precisely, the assertion is probably hiding missing validation or an imprecise upstream type.

`as const` is intentionally exempt because it narrows a value rather than asserting an unrelated runtime contract.
