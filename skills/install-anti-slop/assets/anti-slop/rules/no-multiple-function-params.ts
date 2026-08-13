import { defineRule } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

type ParameterOwner =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature;

/** Encourage named request/command objects instead of long positional function signatures. */
export const noMultipleFunctionParamsRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow functions with more than one parameter; use a named parameter object for multi-value input contracts.",
    },
    messages: {
      multiple:
        "This function has {{count}} positional parameters. Prefer one named request/options object so call sites carry field names and the contract can evolve without parameter-order coupling. See: docs/rules/no-multiple-function-params.md",
    },
  },
  create(context) {
    const check = (node: ParameterOwner) => {
      if (node.params.length <= 1) return;
      context.report({ node, messageId: "multiple", data: { count: String(node.params.length) } });
    };
    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
      TSCallSignatureDeclaration: check,
      TSConstructSignatureDeclaration: check,
      TSConstructorType: check,
      TSDeclareFunction: check,
      TSEmptyBodyFunctionExpression: check,
      TSFunctionType: check,
      TSMethodSignature: check,
    };
  },
});
