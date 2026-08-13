import { RuleTester } from "oxlint/plugins-dev";
import { noMultipleFunctionParamsRule } from "./no-multiple-function-params.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("anti-slop/no-multiple-function-params", noMultipleFunctionParamsRule, {
  valid: [
    "function f(): void {}",
    "function f(input: { a: string; b: number }): void {}",
    "const f = (value: string) => value;",
  ],
  invalid: [
    { code: "function f(a: string, b: number): void {}", errors: [{ messageId: "multiple" }] },
    { code: "type F = (a: string, b: number) => void;", errors: [{ messageId: "multiple" }] },
  ],
});
