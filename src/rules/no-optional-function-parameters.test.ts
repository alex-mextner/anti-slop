import { RuleTester } from "oxlint/plugins-dev";
import { noOptionalFunctionParametersRule } from "./no-optional-function-parameters.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("anti-slop/no-optional-function-parameters", noOptionalFunctionParametersRule, {
  valid: [
    "function f(value: string | undefined): void {}",
    "function f(input: { value?: string }): void {}",
    "function f(value = 'x'): void {}",
  ],
  invalid: [
    { code: "function f(value?: string): void {}", errors: [{ messageId: "optional" }] },
    { code: "type F = (value?: string) => void;", errors: [{ messageId: "optional" }] },
  ],
});
